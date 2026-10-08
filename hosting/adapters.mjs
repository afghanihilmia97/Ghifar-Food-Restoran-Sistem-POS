import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

// Compatibility layer for the D1 methods used by this restaurant worker.
export class LocalDatabase {
  constructor(filename,migrationsDirectory) {
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    this.sqlite=new DatabaseSync(filename);
    this.sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    this.sqlite.exec('CREATE TABLE IF NOT EXISTS ghifar_migrations (name TEXT PRIMARY KEY, hash TEXT NOT NULL)');
    for(const name of fs.readdirSync(migrationsDirectory).filter(n=>n.endsWith('.sql')).sort()) {
      const sql=fs.readFileSync(path.join(migrationsDirectory,name),'utf8');
      const hash=createHash('sha256').update(sql).digest('hex');
      const prior=this.sqlite.prepare('SELECT hash FROM ghifar_migrations WHERE name=?').get(name);
      if(prior){if(prior.hash!==hash)throw Error('Migrasi yang telah diterapkan berubah: '+name);continue;}
      this.sqlite.exec('BEGIN IMMEDIATE');
      try {this.sqlite.exec(sql);this.sqlite.prepare('INSERT INTO ghifar_migrations (name,hash) VALUES (?,?)').run(name,hash);this.sqlite.exec('COMMIT');}
      catch(error){this.sqlite.exec('ROLLBACK');throw error;}
    }
  }
  prepare(sql) {
    const make=params=>({
      bind:(...values)=>make(values),
      first:async column=>{const row=this.sqlite.prepare(sql).get(...params)||null;return column?row?.[column]??null:row;},
      all:async()=>({results:this.sqlite.prepare(sql).all(...params),success:true}),
      _run:()=>{const result=this.sqlite.prepare(sql).run(...params);return {success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};},
      run:async()=>make(params)._run()
    });
    return make([]);
  }
  async batch(statements) {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {const results=statements.map(statement=>statement._run());this.sqlite.exec('COMMIT');return results;}
    catch(error){this.sqlite.exec('ROLLBACK');throw error;}
  }
  close(){this.sqlite.close();}
}

// Store each object's bytes and metadata atomically outside the public assets.
export class LocalBucket {
  constructor(directory){this.directory=path.resolve(directory);fs.mkdirSync(this.directory,{recursive:true});}
  filename(key){return path.join(this.directory,createHash('sha256').update(String(key)).digest('hex')+'.json');}
  async put(key,value,options={}) {
    const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(value);
    const destination=this.filename(key),temporary=destination+'.'+randomUUID()+'.tmp';
    try {fs.writeFileSync(temporary,JSON.stringify({key,bytes:bytes.toString('base64'),httpMetadata:options.httpMetadata||{}}),{mode:0o600});fs.renameSync(temporary,destination);}
    finally {fs.rmSync(temporary,{force:true});}
  }
  async get(key) {
    let value;
    try {value=JSON.parse(fs.readFileSync(this.filename(key),'utf8'));}
    catch(error){if(error.code==='ENOENT')return null;throw error;}
    const bytes=Buffer.from(value.bytes,'base64');
    return {body:bytes,httpMetadata:value.httpMetadata,text:async()=>bytes.toString('utf8'),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  }
  async delete(key){for(const item of Array.isArray(key)?key:[key])fs.rmSync(this.filename(item),{force:true});}
}
