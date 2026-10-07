import fs from 'node:fs';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const path='data/bot-api-key.json';
export function currentApiKey(){try{return JSON.parse(fs.readFileSync(path,'utf8')).key}catch{return null}}
export function ensureApiKey(){const existing=currentApiKey();if(existing)return existing;fs.mkdirSync('data',{recursive:true});const key='fsf_'+randomBytes(32).toString('hex');fs.writeFileSync(path,JSON.stringify({key,createdAt:new Date().toISOString()}),{mode:0o600,flag:'wx'});return key}
export function authorized(header,key=currentApiKey()){
 if(!key||typeof header!=='string'||!header.startsWith('Bearer '))return false;
 const digest=value=>createHash('sha256').update(value).digest();
 return timingSafeEqual(digest(header.slice(7)),digest(key));
}
