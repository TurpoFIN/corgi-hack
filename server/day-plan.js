import {dailyResources,ymcaFacility} from './daily-resources.js';
import {sfDay} from '../src/calendar-links.js';
export const addDay=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
// Resolve local Pacific clock time, including daylight saving changes.
export function atMinute(day,minute){
 const wall=Date.parse(day+'T00:00:00Z')+minute*60000;
 let guess=wall+8*3600000;
 for(let i=0;i<2;i++){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(guess).map(p=>[p.type,p.value]));
  const represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);
  guess+=wall-represented;
 }
 return new Date(guess).toISOString();
}
const ms=v=>new Date(v).getTime();
const fresh=(r,day)=>r.checkedAt<=day&&r.validThrough>=day;
export function buildDayPlan(bookings,profile,{now=Date.now(),start=sfDay(now),removed=[]}={}){
 const days=Array.from({length:7},(_,i)=>addDay(start,i));
 const items=[],alternatives=[];
 const ready=bookings.filter(j=>j.status==='ready'&&j.offer.freeVerified&&j.offer.priceToday===0);
 const add=(id,offer,purpose,startAt,endAt,access,extra={})=>{
  if(removed.includes(id)||ms(startAt)<now)return false;
  const day=sfDay(startAt);
  if(!days.includes(day))return false;
  if(items.some(j=>sfDay(j.offer.startsAt)===day&&ms(startAt)<ms(j.offer.endsAt)+(j.offer.venue===offer.venue?0:30*60000)&&ms(endAt)>ms(j.offer.startsAt)-(j.offer.venue===offer.venue?0:30*60000)))return false;
  items.push({id,status:'ready',purpose,access,createdAt:new Date(now).toISOString(),...extra,offer:{...offer,startsAt:startAt,endsAt:endAt,planDescription:access==='Walk in'?'Suggested visit within published service hours.':'Personal itinerary time; provider admission rules apply.'}});return true;
 };
 for(const j of ready.filter(j=>j.offer.plannedVisit&&j.offer.kind!=='event')){const v=j.offer.plannedVisit;if(ms(v.endsAt)>ms(v.startsAt))add('visit-'+j.id,{...j.offer,venue:v.venue,sources:[...(j.offer.sources||[]),v.sourceUrl],schedule:v.openingHoursEvidence},j.offer.category==='Fitness'?'fitness':'food',v.startsAt,v.endsAt,'Planned visit',{bookingId:j.id});}
 // Keep exact event times; overlapping events stay available as alternatives.
 for(const j of ready.filter(j=>j.offer.startsAt).sort((a,b)=>ms(a.offer.startsAt)-ms(b.offer.startsAt))){
  const o=j.offer;const sourceEnd=o.endsAt||new Date(ms(o.startsAt)+3600000).toISOString();
  const longVisit=ms(sourceEnd)-ms(o.startsAt)>3*3600000;
  const end=longVisit?new Date(ms(o.startsAt)+90*60000).toISOString():sourceEnd;
  if(!add('event-'+j.id,o,o.category==='Fitness'?'fitness':'event',o.startsAt,end,longVisit?'90-min visit':'Event',{bookingId:j.id,eventWindow:{startsAt:o.startsAt,endsAt:sourceEnd}})&&days.includes(sfDay(o.startsAt))&&ms(end)>now)alternatives.push(j);
 }
 const wantsFood=profile.interests?.includes('food')||profile.goals?.some(x=>['hellofresh','factor'].includes(x));
 const wantsFitness=profile.interests?.includes('fitness')||profile.goals?.some(x=>['fitness','classpass'].includes(x));
 const isSF=/^(san francisco|sf)$/i.test(profile.city.trim());
 const broadRadius=(profile.maxDistanceMiles??5)>=5;
 const allowedTime=(day,m)=>profile.timePreference==='weekends'?[0,6].includes(new Date(day+'T12:00Z').getUTCDay()):profile.timePreference==='mornings'?m<720:profile.timePreference==='afternoons'?m>=720&&m<1020:profile.timePreference==='evenings'?m>=1020:true;
 if(isSF&&broadRadius){
  for(const day of days){
   for(const r of dailyResources){
    if(!fresh(r,day)||(r.purpose==='food'&&(!wantsFood||profile.communityMeals===false)))continue;
    // A menu-specific diet cannot be established from these general service pages.
    if(r.purpose==='food'&&profile.diet&&profile.diet!=='No preference')continue;
    for(const [from,to] of r.windows){let placed=false;for(let m=from;m+r.minutes<=to;m+=15){if(!allowedTime(day,m))continue;if(add(r.id+'-'+day,{...r,schedule:r.sourceEvidence},r.purpose,atMinute(day,m),atMinute(day,m+r.minutes),'Walk in')){placed=true;break}}if(placed)break;}
   }
  }
  if(wantsFitness&&profile.allowTrials){
   // Only the source-verified one-day YMCA offer is assigned a facility slot.
   // Other passes need their own dated availability; never repeat a trial claim.
   const y=ready.find(j=>!j.offer.plannedVisit&&j.offer.url==='https://go.ymcasf.org/1-day-pass');
   if(y){for(const day of days){
    if(!fresh(ymcaFacility,day)||new Date(day+'T12:00Z').getUTCDay()===0||!allowedTime(day,570))continue;
    const offer={...y.offer,title:'Workout + shower',venue:ymcaFacility.venue,benefitSummary:'Gym time, then a shower at the Embarcadero Y.',benefits:[{icon:'fitness',label:'Gym access',evidence:'Cardio, Weight and Circuit Training Equipment'},{icon:'shower',label:'Shower',evidence:ymcaFacility.sourceEvidence}],sources:[ymcaFacility.url],schedule:ymcaFacility.hours};
    if(add('ymca-visit-'+y.id,offer,'fitness',atMinute(day,570),atMinute(day,660),'Day pass',{bookingId:y.id}))break;
   }}
  }
 }
 items.sort((a,b)=>ms(a.offer.startsAt)-ms(b.offer.startsAt));
 return {start,days,items,alternatives,generatedAt:new Date(now).toISOString(),summary:{meals:items.filter(i=>i.purpose==='food').length,workouts:items.filter(i=>i.purpose==='fitness').length,events:items.filter(i=>i.purpose==='event').length},notes:!isSF?['Everyday resources currently cover San Francisco.']:[]};
}
