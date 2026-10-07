import fs from 'node:fs';
const configPath='data/agent37.json';
export function config(){return fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):process.env.AGENT37_INSTANCE_ID?{id:process.env.AGENT37_INSTANCE_ID,desktopReady:true}:{};}
export async function control(path,body,method=body?'POST':'GET'){
 if(!process.env.AGENT37_API_KEY)throw Error('Add your Agent37 key to .env.local and restart the local server.');
 const r=await fetch(`https://api.agent37.com${path}`,{method,headers:{Authorization:`Bearer ${process.env.AGENT37_API_KEY}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(180000)});const data=await r.json();if(!r.ok)throw Error(`Agent37 ${r.status}: ${typeof data.error==='string'?data.error:data.error?.message||JSON.stringify(data)}`);return data;
}
let provisioning;
export async function ensureInstance(){
 if(config().id)return config();
 if(provisioning)return provisioning;
 provisioning=(async()=>{const d=await control('/v1/instances',{template:'agent37-hermes',name:'free-sf-hackathon',user:'free-sf-local',budget:{credit_micros:2000000},auto_sleep:true,idle_timeout_seconds:300});fs.writeFileSync(configPath,JSON.stringify({id:d.id,createdAt:new Date().toISOString()}));return config();})();
 try{return await provisioning;}finally{provisioning=null;}
}
export async function instanceCall(path,body,{timeout=180000}={}){const c=await ensureInstance();return fetch(`https://${c.id}.agent37.app${path}`,{method:body?'POST':'GET',headers:{'X-Agent37-Key':process.env.AGENT37_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeout)});}
export async function health(){const c=config();if(!c.id)return{configured:!!process.env.AGENT37_API_KEY,healthy:false,status:'not_started'};const r=await instanceCall('/v1/health');const h=await r.json();return{configured:true,instanceId:c.id,healthy:h.healthy===true,status:h.healthy?'ready':'starting'};}
export const AGENT_MODEL='openai/gpt-6.1-sol';
export async function chooseModel(){
 const c=config();
 if(c.model===AGENT_MODEL)return AGENT_MODEL;
 const r=await instanceCall('/v1/models');
 if(!r.ok)throw Error('Could not verify the requested model in the Agent37 catalog.');
 const d=await r.json();
 if(!(d.data||[]).some(m=>m.id===AGENT_MODEL))throw Error('Agent37 does not expose '+AGENT_MODEL+'. No fallback model will be used.');
 fs.writeFileSync(configPath,JSON.stringify({...c,model:AGENT_MODEL},null,2));
 return AGENT_MODEL;
}
export async function runAgent(input,onEvent,{sessionId}={}){
 const model=await chooseModel();onEvent('status',{text:'OpenAI model connected through Agent37',model});
 const r=await instanceCall('/v1/responses',{input,model,reasoning_effort:'low',stream:true,...(sessionId?{session_id:sessionId}:{})},{timeout:300000});
 if(!r.ok){const d=await r.text();throw Error(`Agent37 ${r.status}: ${d.slice(0,300)}`);}
 let buffer='',output='',terminal=false,responseId,session;const decoder=new TextDecoder();
 for await(const chunk of r.body){buffer+=decoder.decode(chunk,{stream:true}).replace(/\r\n/g,'\n');let split;while((split=buffer.indexOf('\n\n'))!==-1){const frame=buffer.slice(0,split);buffer=buffer.slice(split+2);const type=frame.match(/^event: (.+)$/m)?.[1];const raw=frame.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('\n');if(!type||!raw)continue;let d;try{d=JSON.parse(raw);}catch{continue;}
 if(type==='response.created'){responseId=d.id;session=d.session_id;onEvent('started',{responseId,sessionId:session});}
 if(type==='response.tool_call.started')onEvent('tool',{tool:d.tool,label:d.label||d.tool});
 if(type==='response.tool_call.completed')onEvent('tool_done',{tool:d.tool,duration_ms:d.duration_ms});
 if(type==='response.output_text.delta')output+=d.text||'';
 if(type==='response.completed'){if(d.status==='cancelled')throw Error('Agent run cancelled.');output=d.output_text||output;terminal=true;onEvent('complete',{responseId,sessionId:session,model,usage:d.usage});}
 if(type==='response.failed')throw Error(d.error?.message||d.message||'Agent run failed.');
 }}
 if(!terminal)throw Error('Agent stream ended before completion. No results were marked confirmed.');
 return{output,responseId,sessionId:session,model};
}
