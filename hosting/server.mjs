import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {LocalDatabase,LocalBucket} from './adapters.mjs';
import worker from '../dist/server/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dataDirectory=path.resolve(root,process.env.DATA_DIR||'data');
const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT tidak valid');
const suppliedURL=process.env.APP_URL||`http://localhost:${port}`;
const configured=new URL(suppliedURL);
if(!['http:','https:'].includes(configured.protocol)||configured.pathname!=='/'||configured.search||configured.hash||configured.username||configured.password)throw Error('APP_URL harus berupa origin, misalnya https://kasir.domainanda.com');
if(configured.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(configured.hostname))throw Error('APP_URL publik harus HTTPS agar cookie login dan PWA berfungsi');
const db=new LocalDatabase(path.join(dataDirectory,'ghifar.sqlite'),path.join(root,'drizzle'));
const env={DB:db,BUCKET:new LocalBucket(path.join(dataDirectory,'objects')),GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID||''};
const limit=3_000_000;
const server=http.createServer(async(req,res)=>{
  try {
    if(!req.url?.startsWith('/')||req.url.startsWith('//')){res.writeHead(400);res.end('URL tidak valid');return;}
    const headers=new Headers();
    for(const [name,value] of Object.entries(req.headers)) {
      if(name.startsWith('oai-')||name.startsWith('cf-')||name.startsWith('x-forwarded-')||['host','connection','transfer-encoding','content-length'].includes(name)||value===undefined)continue;
      headers.set(name,Array.isArray(value)?value.join(', '):value);
    }
    // Never trust identity headers from a browser. Standalone hosting uses cookies.
    let ip=req.socket.remoteAddress||'unknown';
    if(process.env.TRUST_PROXY==='1'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip))ip=String(req.headers['x-forwarded-for']||ip).split(',').at(-1).trim();
    headers.set('cf-connecting-ip',ip);
    const chunks=[];let length=0;
    for await(const chunk of req){length+=chunk.length;if(length>limit){res.writeHead(413,{'content-type':'application/json'});res.end(JSON.stringify({error:'Data maksimal 3 MB'}));return;}chunks.push(chunk);}
    const origin=configured.port==='0'?configured.origin.replace(':0',':'+server.address().port):configured.origin;
    const url=new URL(origin+req.url);
    if(url.pathname==='/healthz'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":true}');return;}
    const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await worker.fetch(request,env);
    res.statusCode=response.status;
    for(const [name,value] of response.headers){if(name==='set-cookie')continue;res.setHeader(name,value);}
    const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
    res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','strict-origin-when-cross-origin');
    if(req.method==='HEAD'||!response.body){res.end();return;}
    Readable.fromWeb(response.body).pipe(res);
  } catch(error) {
    console.error('Hosting:',error.message);
    if(!res.headersSent)res.writeHead(500,{'content-type':'application/json','cache-control':'no-store'});
    res.end('{"error":"Layanan belum tersedia. Periksa log server."}');
  }
});
server.requestTimeout=30000;server.headersTimeout=15000;
server.listen(port,host,()=>console.log(`Ghifar Food aktif di ${host}:${server.address().port}; origin ${configured.origin}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>{db.close();process.exit(0);});});
