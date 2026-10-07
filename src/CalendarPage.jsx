import React,{useState,useEffect} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,Download,ExternalLink,MapPin,Clock,X,Link2} from 'lucide-react';
import BenefitContext from './BenefitContext';
import {googleCalendarLink,sfDay} from './calendar-links';
import './calendar.css';
const noon=date=>new Date(date+'T12:00:00Z');
const addDays=(date,n)=>{const d=noon(date);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const time=value=>new Date(value).toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'});
export default function CalendarPage({bookings,onConnect}){
 const today=sfDay(Date.now());
 const [anchor,setAnchor]=useState(today),[selected,setSelected]=useState(null),[connected,setConnected]=useState(false);
 const events=bookings.filter(j=>j.status==='ready'&&j.offer.startsAt).sort((a,b)=>new Date(a.offer.startsAt)-new Date(b.offer.startsAt));
 const monday=addDays(anchor,-((noon(anchor).getUTCDay()+6)%7)),days=Array.from({length:7},(_,i)=>addDays(monday,i));
 useEffect(()=>{let mounted=true;const refresh=()=>fetch('/api/connections').then(r=>r.json()).then(d=>{if(mounted)setConnected((d.connections||[]).some(c=>c.toolkitSlug==='googlecalendar'&&c.status==='ACTIVE'))}).catch(()=>{});refresh();window.addEventListener('focus',refresh);return()=>{mounted=false;window.removeEventListener('focus',refresh)}},[]);
 return <section className="calendar-page"><div className="calendar-heading"><div><span className="eyebrow muted">MORE LIVING. LESS PLANNING.</span><h1>Your calendar.</h1><p>{events.length} plans in your Free SF calendar.</p></div><div className="calendar-actions"><a className="button outline" href="/api/concierge/calendar.ics" download="free-sf-week.ics"><Download size={14}/>Export plans</a>{connected?<a className="button dark" href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noreferrer"><CalendarDays size={15}/>Google Calendar<ExternalLink size={13}/></a>:<button className="button dark" onClick={onConnect}><Link2 size={14}/>Connect Google Calendar</button>}</div></div>
 <div className="calendar-toolbar"><h2>{noon(monday).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})}</h2><div><button onClick={()=>setAnchor(today)}>Today</button><button aria-label="Previous week" onClick={()=>setAnchor(addDays(anchor,-7))}><ChevronLeft size={17}/></button><button aria-label="Next week" onClick={()=>setAnchor(addDays(anchor,7))}><ChevronRight size={17}/></button></div></div>
 <div className="calendar-scroll"><div className="calendar-grid">{days.map(day=><div key={day} className={'calendar-day '+(day===today?'is-today':'')}><div className="calendar-day-label"><span>{noon(day).toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'})}</span><strong>{noon(day).getUTCDate()}</strong></div><div className="calendar-day-events">{events.filter(j=>sfDay(j.offer.startsAt)===day).map((j,i)=><button className={'calendar-event tone-'+i%3} key={j.id} onClick={()=>setSelected(j)}><span>{time(j.offer.startsAt)}</span><strong>{j.offer.title}</strong><small>{j.offer.category}</small><b>$0</b></button>)}</div></div>)}</div></div>
 {!events.length&&<div className="calendar-empty"><CalendarDays size={28}/><h3>Your plans will land here.</h3><p>Let Scout find your next free week.</p></div>}
 <div className="calendar-foot"><span><i/>Free SF plans</span><small>Pacific time</small></div>
 {selected&&<div className="concierge-overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}><div className="week-detail"><button className="setup-close icon-button" aria-label="Close calendar event" onClick={()=>setSelected(null)}><X size={20}/></button><span className="eyebrow muted">IN YOUR FREE SF CALENDAR</span><h2>{selected.offer.title}</h2><BenefitContext offer={selected.offer}/><p><Clock size={14}/>{selected.offer.schedule}</p><p><MapPin size={14}/>{selected.offer.venue}</p><a className="button dark full" href={googleCalendarLink(selected.offer)} target="_blank" rel="noreferrer"><CalendarDays size={15}/>Add to Google Calendar<ExternalLink size={13}/></a><a className="calendar-source" href={selected.offer.url} target="_blank" rel="noreferrer">Original event<ExternalLink size={12}/></a></div></div>}
 </section>
}
