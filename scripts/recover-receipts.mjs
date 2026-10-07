// Recover provider outputs after a projection/schema failure, without replaying any signup.
// Run only while the local server is stopped.
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {readDocument,writeDocument} from '../server/insforge.js';
import {instanceCall,control,config} from '../server/agent37.js';
import {parseJson} from '../server/domain.js';
const sessions=JSON.parse(fs.readFileSync('evidence/run-sessions.json','utf8'));
const state=await readDocument('concierge');
fs.mkdirSync('data/receipts',{recursive:true});
for(const {serviceId,sessionId} of sessions){
 const r=await instanceCall(`/v1/sessions/${sessionId}`);if(!r.ok)continue;
 const session=await r.json();if(session.active_response_id)throw Error(`Session for ${serviceId} is still active; do not replay it.`);
 const answer=session.history?.filter(x=>x.role==='assistant').at(-1)?.content;
 if(!answer)continue;
 fs.writeFileSync(`evidence/${serviceId}-original-response.txt`,answer);
 let out;try{out=parseJson(answer);}catch{continue;}
 if(!['secured','needs_you','not_free','unavailable'].includes(out.status))continue;
 if(out.status==='secured'&&(!out.confirmation||!out.receiptText))out.status='needs_you';
 if(out.screenshotPath&&(/^\/home\/node\/\.hermes\/cache\/screenshots\/[\w.-]+\.png$/.test(out.screenshotPath)||out.screenshotPath===`/home/node/free-sf/receipts/${serviceId}.png`)){
  const image=await instanceCall('/v1/files/content?path='+encodeURIComponent(out.screenshotPath));if(image.ok)fs.writeFileSync(`data/receipts/${serviceId}.png`,Buffer.from(await image.arrayBuffer()));else delete out.screenshotPath;
 }else delete out.screenshotPath;
 const provider={classpass:'ClassPass',hellofresh:'HelloFresh',factor:'Factor',luma:'Luma',fitness:'FITNESS SF'}[serviceId];
 const result={...out,id:randomUUID(),serviceId,provider,sessionId,category:['hellofresh','factor'].includes(serviceId)?'Meal delivery':serviceId==='luma'?'Events & food':'Fitness',at:new Date().toISOString(),recovered:true};
 state.results=state.results.filter(x=>x.serviceId!==serviceId);state.results.push(result);state.history.unshift(result);
 state.activity.unshift({id:randomUUID(),kind:out.status==='secured'?'secured':'attention',serviceId,text:`${provider}: ${out.title}`,at:new Date().toISOString()});
 const encoded=Buffer.from(JSON.stringify(out,null,2)).toString('base64');
 const saved=await control(`/v1/instances/${config().id}/exec`,{command:`mkdir -p /home/node/free-sf/receipts && printf '%s' '${encoded}' | base64 -d > /home/node/free-sf/receipts/${serviceId}.json`});
 if(saved.exit_code!==0)throw Error('VM receipt persistence failed');
 console.log({provider,status:out.status,fieldsFilled:out.fieldsFilled,proof:!!out.screenshotPath});
}
await writeDocument('concierge',state);
console.log('Original provider responses recovered to InsForge without replaying transactions.');
