import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {once} from 'node:events';
import {createGateway} from './api-gateway.js';
test('public gateway forwards authenticated API requests but never owner or file routes',async t=>{
 const backend=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({path:req.url,auth:req.headers.authorization,key:req.headers['idempotency-key']}));});backend.listen(0,'127.0.0.1');await once(backend,'listening');
 const proxy=createGateway({port:backend.address().port});proxy.listen(0,'127.0.0.1');await once(proxy,'listening');t.after(()=>{proxy.close();backend.close()});const base='http://127.0.0.1:'+proxy.address().port;
 const r=await fetch(base+'/api/v1/tasks?x=1',{headers:{Authorization:'Bearer test','Idempotency-Key':'unique'}});assert.deepEqual(await r.json(),{path:'/api/v1/tasks?x=1',auth:'Bearer test',key:'unique'});
 for(const path of ['/','/api/concierge','/data/bot-api-key.json','/api/v1/../concierge','/api/v1/%2f..%2fconcierge'])assert.equal((await fetch(base+path)).status,404,path);
});
