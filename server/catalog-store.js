import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {sources,SOURCE_MAP_VERSION} from './source-map.js';
const exec=promisify(execFile);
const ref=process.env.SUPABASE_PROJECT_REF||(fs.existsSync('data/supabase-config.json')?JSON.parse(fs.readFileSync('data/supabase-config.json','utf8')).projectRef:null);
export const catalogStorage={provider:'Supabase',connected:false,sourceCount:0,error:null};
async function token(){if(process.env.SUPABASE_ACCESS_TOKEN)return process.env.SUPABASE_ACCESS_TOKEN;try{return(await exec('hsec',['get',process.env.SUPABASE_HSEC_NAME||'supabase-corgi-hack'],{timeout:3000,maxBuffer:16384})).stdout.trim();}catch{return null;}}
async function query(sql){if(!ref)return null;const key=await token();if(!key)return null;const response=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Supabase catalog HTTP '+response.status);return response.json();}
const jsonSql=value=>`convert_from(decode('${Buffer.from(JSON.stringify(value)).toString('hex')}','hex'),'UTF8')::jsonb`;
let ready=false;
export async function syncCatalog(){
 try{
 const result=await query(`CREATE SCHEMA IF NOT EXISTS scout_catalog;
 CREATE TABLE IF NOT EXISTS scout_catalog.sources (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS scout_catalog.observations (url text PRIMARY KEY, data jsonb NOT NULL, checked_at timestamptz NOT NULL DEFAULT now());
 REVOKE ALL ON SCHEMA scout_catalog FROM anon, authenticated;
 INSERT INTO scout_catalog.sources(id,data) SELECT value->>'id',value FROM jsonb_array_elements(${jsonSql(sources.map(s=>({...s,version:SOURCE_MAP_VERSION})))}) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=now();
 SELECT count(*)::int AS count FROM scout_catalog.sources;`);
 if(!result)return catalogStorage;
 ready=true;catalogStorage.connected=true;catalogStorage.sourceCount=sources.length;catalogStorage.error=null;
 }catch(e){catalogStorage.connected=false;catalogStorage.error=e.message;}
 return catalogStorage;
}
export async function catalogObservations(){
 if(!ready)return [];
 try{const result=await query("SELECT data FROM scout_catalog.observations WHERE checked_at > now() - interval '7 days' ORDER BY checked_at DESC LIMIT 40");return (result||[]).map(r=>r.data);}catch{return [];}
}
export async function saveObservations(offers){
 if(!ready||!offers.length)return;
 // Only public source facts; no identities, addresses, user prompts or planned visits.
 const facts=offers.map(o=>({url:o.url,title:o.title,priceToday:o.priceToday,priceEvidence:o.priceEvidence,sourceEvidence:o.sourceEvidence,freeVerified:o.freeVerified,checkedAt:new Date().toISOString()}));
 try{await query(`INSERT INTO scout_catalog.observations(url,data) SELECT value->>'url',value FROM jsonb_array_elements(${jsonSql(facts)}) ON CONFLICT(url) DO UPDATE SET data=excluded.data,checked_at=now()`);}catch(e){catalogStorage.error=e.message;}
}
