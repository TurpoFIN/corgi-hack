import {sfDay} from './calendar-links.js';
export function taskSections(tasks,now=Date.now()){
 const today=sfDay(now);
 const completed=tasks.filter(t=>t.status==='completed').sort((a,b)=>new Date(b.finishedAt||0)-new Date(a.finishedAt||0));
 return {open:tasks.filter(t=>!['completed','cancelled'].includes(t.status)),completed,completedToday:completed.filter(t=>t.finishedAt&&sfDay(t.finishedAt)===today).length};
}
export function taskStage(task,{mission,discovery,paused}={}){
 const states={completed:'Done',needs_input:'Needs you',failed:'Retry needed',paused:'Paused',queued:paused?'Paused':'Queued'};
 if(task.status!=='running')return states[task.status]||'Queued';
 if(mission?.id===task.missionId&&mission.current==='booking')return 'Arranging';
 const activity=discovery?.id===task.missionId?discovery.tools:task.activity;
 const tool=activity?.at(-1)?.tool||'';
 if(/search/i.test(tool))return 'Searching';
 if(/extract|browser/i.test(tool))return 'Checking sources';
 if(/read_file/i.test(tool))return 'Reading preferences';
 return 'Researching';
}
export function taskOutcome(task){
 const offers=task.opportunities||[];
 const free=offers.filter(o=>o.freeVerified&&o.priceToday===0&&!o.expired);
 if(free.length)return free.length===1?`Found ${free[0].title}`:`Found ${free.length} free options · ${free[0].title}`;
 if(offers.length)return `Checked ${offers.length} ${offers.length===1?'option':'options'} · no verified free match`;
 return task.result?.split(/(?<=[.!?])\s/)[0]||'';
}
export function completionTime(value,now=Date.now()){
 if(!value)return '';
 const time=new Date(value).toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'});
 return sfDay(value)===sfDay(now)?`Today, ${time}`:`${new Date(value).toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric'})}, ${time}`;
}
