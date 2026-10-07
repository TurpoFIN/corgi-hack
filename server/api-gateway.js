import http from 'node:http';
import {pathToFileURL} from 'node:url';
export function createGateway({port=5173}={}){
 return http.createServer((req,res)=>{
  const raw=req.url||'/';
  const path=raw.split('?')[0];
  let normalized;try{normalized=new URL(raw,'http://localhost').pathname}catch{}
  if(!normalized?.startsWith('/api/v1/')||!path.startsWith('/api/v1/')||/%2e|%2f|%5c|\\/i.test(path)){
   res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"API route not found"}');return;
  }
  const headers={};for(const name of ['authorization','content-type','accept','idempotency-key'])if(req.headers[name])headers[name]=req.headers[name];
  const upstream=http.request({hostname:'127.0.0.1',port,path:raw,method:req.method,headers},response=>{
   const safe={};for(const name of ['content-type','content-disposition','cache-control','location','retry-after'])if(response.headers[name])safe[name]=response.headers[name];
   res.writeHead(response.statusCode||502,safe);response.pipe(res);
  });
  upstream.setTimeout(60000,()=>upstream.destroy());
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end('{"error":"Backend unavailable"}');});
  req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)createGateway({port:Number(process.env.PORT)||5173}).listen(Number(process.env.GATEWAY_PORT)||5174,'127.0.0.1',()=>console.log('API-only gateway listening on127.0.0.1:5174'));
