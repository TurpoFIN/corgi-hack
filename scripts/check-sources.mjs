import {sources} from '../server/source-map.js';
import fs from 'node:fs';
const queue=[...sources],results=[];
await Promise.all(Array.from({length:10},async()=>{while(queue.length){const s=queue.shift();try{const r=await fetch(s.url,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Mozilla/5.0 ScoutSourceCheck/1.0'}});results.push({id:s.id,url:s.url,status:r.status,finalUrl:r.url,checkedAt:new Date().toISOString()});await r.body?.cancel();}catch{results.push({id:s.id,url:s.url,status:null,error:'unreachable_or_timeout',checkedAt:new Date().toISOString()});}}}));
fs.writeFileSync('data/source-map-health.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({total:results.length,reachable:results.filter(r=>r.status>=200&&r.status<400).length,blocked:results.filter(r=>[401,403,429].includes(r.status)).length,missing:results.filter(r=>[404,410].includes(r.status)).map(r=>r.id),unknown:results.filter(r=>!r.status).map(r=>r.id)}));
