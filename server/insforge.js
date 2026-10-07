import fs from 'node:fs';
import {createAdminClient} from '@insforge/sdk';
const linked=JSON.parse(fs.readFileSync('.insforge/project.json','utf8'));
const db=createAdminClient({baseUrl:linked.oss_host,apiKey:linked.api_key,retryCount:0,timeout:10000});
export const storageStatus={provider:'InsForge',healthy:false,lastSaved:null,error:null};
export async function readDocument(id){const {data,error}=await db.database.from('free_sf_documents').select('document').eq('id',id).maybeSingle();if(error)throw Error(error.message);storageStatus.healthy=true;return data?.document;}
export async function writeDocument(id,document){const {error}=await db.database.from('free_sf_documents').upsert({id,document,updated_at:new Date().toISOString()},{onConflict:'id'});if(error){storageStatus.healthy=false;storageStatus.error=error.message;throw Error(error.message);}storageStatus.healthy=true;storageStatus.error=null;storageStatus.lastSaved=new Date().toISOString();}
