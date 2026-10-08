import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {LocalDatabase,LocalBucket} from '../hosting/adapters.mjs';
import cloudflare from '../hosting/cloudflare.mjs';

const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ghifar-hosting-'));
let server,count=0,base='',cookie='',workspace='';
const check=(condition,label)=>{assert.ok(condition,label);count++;};
async function start(){
  server=spawn(process.execPath,['hosting/server.mjs'],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',APP_URL:'http://localhost:0',DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  let out='';
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Server tidak mulai: '+out)),15000);
    server.stderr.on('data',bytes=>{out+=bytes;});
    server.once('exit',code=>{clearTimeout(timer);reject(Error('Server keluar '+code+': '+out));});
    server.stdout.on('data',bytes=>{out+=bytes;const match=out.match(/aktif di 127\.0\.0\.1:(\d+)/);if(match){base='http://localhost:'+match[1];clearTimeout(timer);resolve();}});
  });
}
async function stop(){if(!server||server.exitCode!==null)return;const exit=once(server,'exit');server.kill('SIGTERM');await exit;}
async function call(route,{method='GET',body,raw,anonymous=false,headers={}}={}){
  const response=await fetch(base+route,{method,headers:{...(!anonymous&&cookie?{cookie}:{}),...(body!==undefined?{'content-type':'application/json'}:{}),...headers},...(body!==undefined||raw!==undefined?{body:raw??JSON.stringify(body)}:{})});
  const data=response.headers.get('content-type')?.includes('application/json')?await response.json():await response.text();
  return {status:response.status,data,headers:response.headers};
}
const api=route=>'/api/'+route+'?workspace='+encodeURIComponent(workspace);
try {
  // Batch rollback must prevent half-written payments/accounts on failure.
  let db=new LocalDatabase(path.join(directory,'adapter.sqlite'),path.resolve('drizzle'));
  await db.prepare('INSERT INTO workspaces (id,owner,data,updated) VALUES (?,?,?,?)').bind('test','test','{}','today').run();
  await assert.rejects(db.batch([db.prepare('UPDATE workspaces SET revision=99 WHERE id=?').bind('test'),db.prepare('INSERT INTO accounts (id,email,workspace,created) VALUES (?,?,?,?)').bind(null,'invalid@example.test','test','today')]));count++;
  check((await db.prepare('SELECT revision FROM workspaces WHERE id=?').bind('test').first()).revision===0,'Batch failure rolls back update');
  db.close();db=new LocalDatabase(path.join(directory,'adapter.sqlite'),path.resolve('drizzle'));
  check((await db.prepare('SELECT count(*) AS n FROM ghifar_migrations').first()).n===5,'Migrations run once across restart');db.close();
  const bucket=new LocalBucket(path.join(directory,'adapter-objects'));
  await bucket.put('../../outside',new Uint8Array([0,255,1]),{httpMetadata:{contentType:'application/octet-stream'}});
  check(Buffer.from(await (await bucket.get('../../outside')).arrayBuffer()).equals(Buffer.from([0,255,1])),'Object bytes round trip without key traversal');
  await bucket.put('backup',JSON.stringify({ok:true}),{httpMetadata:{contentType:'application/json'}});
  check(JSON.parse(await (await bucket.get('backup')).text()).ok,'Backup text round trip');
  await bucket.delete(['backup','../../outside']);check(await bucket.get('backup')===null,'Object deletion');

  await start();
  check((await call('/healthz')).status===200,'HTTP health');
  check((await call('/')).data.includes('enterprise.js'),'Frontend HTML');
  check(!(await call('/enterprise.js')).data.includes('/signin-with-chatgpt?'),'No broken ChatGPT login on standalone frontend');
  check((await call('/api/session',{anonymous:true,headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'fake@example.test'}})).status===401,'HTTP identity spoof rejected');
  const registration=await call('/api/auth/register',{anonymous:true,method:'POST',body:{email:'hosting@example.test',password:'portable-password-123'}});
  check(registration.status===201,'Register owner through actual HTTP');workspace=registration.data.workspace;
  cookie=registration.headers.getSetCookie()[0].split(';')[0];
  check(registration.headers.getSetCookie()[0].includes('HttpOnly')&&registration.headers.getSetCookie()[0].includes('Secure'),'Secure session cookie preserved');
  check((await call(api('session'))).data.role==='Owner','Cookie authenticates owner');
  check((await call(api('state'),{method:'PUT',body:{},headers:{origin:'https://foreign.example'}})).status===403,'Foreign origin rejected');
  let state=(await call(api('state'))).data;
  state.data.settings.name='Ghifar Hosting Test';
  const update=await call(api('state'),{method:'PUT',body:{revision:state.revision,data:state.data,action:'Pengujian hosting'}});
  check(update.status===200,'State saved to SQLite');
  check((await call(api('state'),{method:'PUT',body:{revision:state.revision,data:state.data}})).status===409,'Old revision conflict rejected');
  const image=Buffer.from('89504e470d0a1a0a','hex');
  const uploaded=await call(api('upload'),{method:'POST',raw:image,headers:{'content-type':'image/png'}});
  check(uploaded.status===200&&uploaded.data.url.startsWith('/api/photo'),'Photo object upload');
  state=(await call(api('state'))).data;state.data.settings.logo=uploaded.data.url;
  check((await call(api('state'),{method:'PUT',body:{revision:state.revision,data:state.data}})).status===200,'Attach logo to workspace');
  let photo=await fetch(base+uploaded.data.url);
  check(photo.status===200&&Buffer.from(await photo.arrayBuffer()).equals(image),'Photo bytes served via API');
  const command={id:randomUUID(),type:'category-save',payload:{name:'Hosting Persisten'}};
  check((await call(api('commands'),{method:'POST',body:command})).status===200,'Atomic command persisted');
  check((await call(api('commands'),{method:'POST',body:command})).data.duplicate,'Repeated command is idempotent');
  check((await call(api('backups'),{method:'POST',body:{}})).status===200,'Manual backup to local bucket');
  const backups=await call(api('backups'));check(backups.data.length>0,'Backup index stored');
  // A public Cloudflare wrapper must also strip externally supplied identity.
  const remoteDB=new LocalDatabase(path.join(directory,'cloudflare.sqlite'),path.resolve('drizzle'));
  const response=await cloudflare.fetch(new Request('https://example.test/api/session',{headers:{'oai-authenticated-user-id':'forged'}}),{DB:remoteDB,BUCKET:bucket});
  check(response.status===401,'Cloudflare wrapper rejects external identity headers');remoteDB.close();
  await stop();await start();
  check((await call(api('session'))).status===200,'Session survives server restart');
  const persisted=(await call(api('state'))).data;
  check(persisted.data.settings.name==='Ghifar Hosting Test'&&persisted.data.categories.some(c=>c.name==='Hosting Persisten'),'Workspace survives restart');
  photo=await fetch(base+uploaded.data.url);check(photo.status===200&&Buffer.from(await photo.arrayBuffer()).equals(image),'Photo survives restart');
  check((await call(api('backups'))).data.length>0,'Backup survives restart');
  const logout=await call('/api/auth/logout',{method:'POST',body:{}});check(logout.status===200,'Logout');
  check((await call(api('session'))).status===401,'Logged out token rejected');
  const login=await call('/api/auth/login',{method:'POST',anonymous:true,body:{email:'hosting@example.test',password:'portable-password-123'}});
  check(login.status===200&&login.data.workspace===workspace,'Fresh login after persistent restart');
  console.log(count+' pemeriksaan hosting mandiri lulus.');
}finally{await stop();fs.rmSync(directory,{recursive:true,force:true});}
