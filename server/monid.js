import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export async function monidKey(){
 if(process.env.MONID_API_KEY)return process.env.MONID_API_KEY.trim();
 try{const {stdout}=await exec('hsec',['get',process.env.MONID_HSEC_NAME||'MONID_API_KEY'],{timeout:3000,maxBuffer:16384});return stdout.trim();}catch{return null;}
}
export async function prepareMonid({mission,writeRemote}){
 const key=await monidKey();
 if(!key)return {configured:false,instruction:''};
 await writeRemote('monid-client.py',fs.readFileSync(new URL('./monid-vm.py',import.meta.url),'utf8'));
 // writeRemote uses umask 077. Keep secrets out of profile, prompts and database.
 try{await writeRemote('monid-config.json',{key,mission});}catch{throw Error('Could not configure Monid on the Agent37 computer.');}
 return {configured:true,instruction:`Monid is available on your Agent37 computer. Use it for a real public-web search or page extraction in this task when research is needed. Never print or read the credential file into your response.\nCall python3 /home/node/free-sf/monid-client.py discover '{"query":"web search or webpage extraction","limit":5}'. Inspect a relevant result with action inspect and {"provider":"discovered slug","endpoint":"discovered path"}. Use only public web search, scraping or extraction endpoints; no identity enrichment, messaging, purchases or account mutations. Follow the exact inspected input schema, then use action run with {provider,endpoint,input}. Do not guess endpoint names or parameters. One public URL or query, at most 5 results. This helper enforces max 5 runs and $0.25 reserved cost per mission, max $0.10 per fixed-price call. No wallet topups. For async runs, use result with {runId}; stop on terminal states. COMPLETED is only successful if providerResponse.httpStatus is less than 400 and usable output is present. Cite source URLs returned by the tool, not Monid metadata. Never invent a successful run. If no useful fixed-price tool exists or Monid fails, use the existing native search/browser tools and report the limitation.`};
}
