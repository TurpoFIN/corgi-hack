export function googleCalendarLink(offer){
 if(!offer.startsAt)return null;
 const start=new Date(offer.startsAt),givenEnd=offer.endsAt&&new Date(offer.endsAt);
 if(!Number.isFinite(start.getTime()))return null;
 const end=givenEnd&&givenEnd>start?givenEnd:new Date(start.getTime()+3600000);
 const stamp=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
 const details=[offer.benefitSummary||'',offer.schedule,offer.url,'Personal plan from Free SF. This calendar entry is not an admission ticket.',...(!givenEnd?['One-hour planning block; adjust the end time as needed.']:[])].filter(Boolean).join('\n\n');
 const params=new URLSearchParams({action:'TEMPLATE',text:offer.title,dates:`${stamp(start)}/${stamp(end)}`,details,location:offer.venue,ctz:'America/Los_Angeles'});
 return 'https://calendar.google.com/calendar/render?'+params.toString();
}
export function sfDay(value){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
