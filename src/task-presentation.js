import {sfDay} from './calendar-links.js';
export function taskSections(tasks,now=Date.now()){
 const today=sfDay(now);
 const completed=tasks.filter(t=>t.status==='completed').sort((a,b)=>new Date(b.finishedAt||0)-new Date(a.finishedAt||0));
 return {open:tasks.filter(t=>!['completed','cancelled'].includes(t.status)),completed:completed.filter(t=>!t.dismissedAt),completedToday:completed.filter(t=>t.finishedAt&&sfDay(t.finishedAt)===today).length};
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
export function completedTaskCard(task,bookings=[]){
 const offers=task.opportunities||[],eligible=offers.filter(o=>o.freeVerified&&o.priceToday===0&&!o.expired);
 const jobFor=o=>bookings.find(j=>j.offer?.url===o.url);
 const offer=eligible.find(o=>jobFor(o)?.status==='ready')||eligible[0];
 if(!offer)return {matched:false,headline:`${task.text?.split(/(?<=[.!?])\s/)[0]?.replace(/[.!?]$/,'')||'This search'} — no match yet`,subheading:task.coverage?.providers?.length?`${task.coverage.providers.map(p=>p.name).slice(0,3).join(' · ')}${task.coverage.providers.length>3?' +'+(task.coverage.providers.length-3):''}`:`${offers.length} ${offers.length===1?'option checked':'options checked'}`,next:'Expand to more sources',action:'Search more broadly',where:'',when:''};
 const text=[offer.schedule,offer.terms,offer.eligibility].filter(Boolean).join(' ');
 const job=jobFor(offer),arranged=job?.status==='ready';
 const needsApproval=/approval/i.test(text.replace(/no (?:host )?approval(?: is)? required/ig,''));
 const waitlisted=/waitlist|event full/i.test(text);
 const progress={queued:'Queued',preparing:'Preparing',booking:'Arranging',paused:'Paused',cancelled:'Removed from your week'};
 const onSite=/sign up at|in.person signup|on.site signup/i.test(text);
 const signupTime=text.match(/sign[ -]?ups? begin at\s+([^.;]+)/i)?.[1];
 const start=offer.startsAt||offer.plannedVisit?.startsAt,end=offer.endsAt||offer.plannedVisit?.endsAt;
 let when='';
 if(start){const opts={timeZone:'America/Los_Angeles'};when=new Date(start).toLocaleDateString('en-US',{...opts,weekday:'short',month:'short',day:'numeric'})+' · '+new Date(start).toLocaleTimeString('en-US',{...opts,hour:'numeric',minute:'2-digit'});if(end)when+='–'+new Date(end).toLocaleTimeString('en-US',{...opts,hour:'numeric',minute:'2-digit'});}
 const where=(offer.venue||'').split(';')[0].replace(/,?\s*San Francisco(?:,?\s*CA)?(?:\s*\d{5})?$/i,'');
 const headline=offer.benefits?.[0]?.label||offer.title;
 return {matched:true,offer,headline,subheading:offer.title,where,when,arranged,next:onSite?`Walk in${signupTime?' · from '+signupTime:''}`:arranged?(offer.kind==='event'?(waitlisted?'Waitlist joined':needsApproval?'Request sent · awaiting approval':'Registered'):offer.kind==='trial'?'Pass ready':'Ready to use'):(progress[job?.status]||'Found'),action:onSite?'Directions':offer.kind==='event'?'View event':'View pass',href:onSite?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(((offer.venue.match(/sign-up at (.+)$/i)?.[1])||where)+', San Francisco, CA'):offer.url};
}
