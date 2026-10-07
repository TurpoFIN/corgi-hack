import {randomUUID} from 'node:crypto';
import {escapeIcs} from './domain.js';
export function createBooking(offer,profile,now=Date.now()){
 if(!offer.freeVerified||offer.priceToday!==0)throw Error('Only verified zero-cost offers can enter automatic booking.');
 if(offer.startsAt&&new Date(offer.endsAt||offer.startsAt).getTime()<now)throw Error('This event has already ended.');
 return {id:randomUUID(),offer:structuredClone(offer),person:{name:profile.name,email:profile.email,address:profile.address},status:'queued',adapter:'simulated',createdAt:new Date(now).toISOString(),history:[]};
}
export function transitionBooking(job,status,at=new Date().toISOString()){
 const allowed={queued:['preparing','cancelled'],preparing:['booking','paused','cancelled'],booking:['ready','paused','cancelled'],ready:['cancelled'],paused:['queued','cancelled'],cancelled:['queued']};
 if(!allowed[job.status]?.includes(status))throw Error(`Cannot change booking from ${job.status} to ${status}`);
 job.status=status;job.updatedAt=at;job.history.push({status,at});return job;
}
export function bookingsCalendar(jobs){
 const stamp=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Free SF//Personal week//EN',...jobs.filter(j=>j.status==='ready'&&j.offer.startsAt).flatMap(j=>['BEGIN:VEVENT',`UID:${j.id}@free-sf.local`,`DTSTAMP:${stamp(j.updatedAt||j.createdAt)}`,`DTSTART:${stamp(j.offer.startsAt)}`,...(j.offer.endsAt?[`DTEND:${stamp(j.offer.endsAt)}`]:[]),`SUMMARY:${escapeIcs(j.offer.title)}`,`LOCATION:${escapeIcs(j.offer.venue)}`,`URL:${escapeIcs(j.offer.url)}`,`DESCRIPTION:${escapeIcs('Personal plan. Provider booking was simulated; this is not an admission ticket. '+j.offer.terms)}`,'STATUS:TENTATIVE','END:VEVENT']),'END:VCALENDAR'].join('\r\n');
}
