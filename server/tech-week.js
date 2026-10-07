import fs from 'node:fs';
import {sfDay} from '../src/calendar-links.js';
export const TECH_WEEK_MCP='https://www.tech-week.com/api/mcp';
export async function techWeekCall(name,args={}){
 const r=await fetch(TECH_WEEK_MCP,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Tech Week API HTTP '+r.status);
 const d=await r.json();if(d.error||d.result?.isError)throw Error('Tech Week API could not complete the search');return d.result.structuredContent;
}
export async function techWeekContext(now=Date.now()){
 const cities=await techWeekCall('list_cities');const city=cities.cities.find(c=>c.slug==='sf');
 const dates=(city?.days||[]).filter(day=>day>=sfDay(now));
 if(!dates.length)return {city,checkedAt:new Date().toISOString(),searched:0,candidates:[]};
 // No guessed filter keys. The provider publishes its own vocabulary.
 const filters=await techWeekCall('list_filters',{city:'sf'});
 const batches=[];
 for(const date of dates){
  const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'}).format(now));
  const buckets=date===sfDay(now)&&hour>=12?(hour>=17?['evening']:['afternoon','evening']):['morning','noon','afternoon','evening'];
  const parts=await Promise.all(buckets.map(async timeOfDay=>{
   const found=[];
   for(let page=1;page<=4;page++){
    const result=await techWeekCall('search_events',{city:['sf'],date,timeOfDay:[timeOfDay],registration:['open'],limit:75,page});
    found.push(...result.events);if(!result.hasMore)break;
   }
   return found;
  }));
  batches.push([...new Map(parts.flat().filter(e=>!e.startsAt||Date.parse(e.startsAt)>now).map(e=>[e.id,e])).values()]);
 }

 const all=batches.flat();
 const pick=[];
 for(const events of batches){
  const ranked=events.filter(e=>!(e.neighborhoods||[]).some(n=>/virtual|east bay|palo alto|mountain view|stanford|san mateo|hillsborough/i.test(n))).sort((a,b)=>score(b)-score(a));
  for(const bucket of ['Morning','Noon','Afternoon','Evening'])pick.push(...ranked.filter(e=>e.timeOfDay===bucket).slice(0,4));
 }
 const candidates=[...new Map(pick.map(e=>[e.id,e])).values()].map(({id,name,date,startsAt,endsAt,venue,registration,eventUrl,excerpt,formats})=>({id,name,date,startsAt,endsAt,venue,registration,eventUrl,excerpt,formats}));
 const result={city,checkedAt:new Date().toISOString(),searched:all.length,candidates};
 fs.writeFileSync('data/tech-week-catalog.json',JSON.stringify({result,events:all,filters},null,2),{mode:0o600});return result;
}
function score(e){return (e.isFeatured?5:0)+(/free|coffee|breakfast|lunch|dinner|food|drinks|happy hour/i.test(e.name+' '+e.excerpt)?10:0);}
