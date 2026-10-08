import worker from '../dist/server/index.js';
// Cloudflare public Workers do not have the authenticated Sites gateway.
export default {async fetch(request,env){
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.startsWith('oai-'))headers.delete(name);
  return worker.fetch(new Request(request,{headers}),env);
}};
