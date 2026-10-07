import React from 'react';
import DealValue from './DealValue';
import {CalendarDays,ArrowRight,Utensils,Dumbbell,BookOpen,Ticket,MapPin} from 'lucide-react';
const icons={food:Utensils,fitness:Dumbbell,workspace:BookOpen,event:Ticket};
export default function AgendaOverview({plan,onOpen}){
 const items=(plan?.items||[]).slice(0,7);
 return <section className="agenda-overview"><div className="workspace-section-heading"><h2>Next up</h2><button onClick={()=>onOpen()}>Open calendar<ArrowRight size={13}/></button></div>{items.map(j=>{const Icon=icons[j.purpose]||Ticket;const date=new Date(j.offer.startsAt);return <button className="agenda-row" key={j.id} onClick={()=>onOpen(j)}><span className="agenda-time"><strong>{date.toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'})}</strong><small>{date.toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric'})}</small></span><span className={'agenda-icon purpose-'+j.purpose}><Icon size={17}/></span><span className="agenda-info"><strong>{j.offer.title}</strong><small>{j.offer.venue}</small></span><span className="agenda-price"><DealValue value={j.offer.valueUsd}/></span></button>})}{!items.length&&<p className="workspace-empty">No upcoming plans. Give Scout a task to get started.</p>}</section>
}
