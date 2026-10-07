import {z} from 'zod';
import {atMinute,addDay} from './day-plan.js';
import {sfDay} from '../src/calendar-links.js';
export const recurrenceInput=z.object({frequency:z.enum(['daily','weekdays','weekly','monthly']),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('08:00'),dayOfWeek:z.number().int().min(0).max(6).default(1),dayOfMonth:z.number().int().min(1).max(31).default(1)}).strict();
export function nextOccurrence(input,after=Date.now()){
 const schedule=recurrenceInput.parse(input),[hour,minute]=schedule.time.split(':').map(Number),today=sfDay(after);
 for(let i=0;i<370;i++){
  const day=addDay(today,i),d=new Date(day+'T12:00:00Z'),dow=d.getUTCDay();
  if(schedule.frequency==='weekdays'&&(dow===0||dow===6))continue;
  if(schedule.frequency==='weekly'&&dow!==schedule.dayOfWeek)continue;
  if(schedule.frequency==='monthly'){
   const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
   if(d.getUTCDate()!==Math.min(schedule.dayOfMonth,last))continue;
  }
  const instant=atMinute(day,hour*60+minute);
  if(Date.parse(instant)>Number(after))return instant;
 }
 throw Error('Could not find the next scheduled run.');
}
export function recurrenceSpec(schedule){if(!schedule)return null;return recurrenceInput.parse(Object.fromEntries(['frequency','time','dayOfWeek','dayOfMonth'].map(k=>[k,schedule[k]])));}
export function enqueueScheduledTasks(tasks,createTask,now=Date.now()){
 const created=[];
 for(const parent of [...tasks]){
  const s=parent.schedule;
  if(!s?.enabled||!s.nextRunAt||Date.parse(s.nextRunAt)>now)continue;
  if(tasks.some(t=>(t.id===parent.id||t.scheduleId===parent.id)&&['queued','running','paused','needs_input'].includes(t.status)))continue;
  const occurrence=s.nextRunAt;
  if(!tasks.some(t=>t.scheduleId===parent.id&&t.scheduledFor===occurrence)){
   const task=createTask({text:parent.text});task.scheduleId=parent.id;task.scheduledFor=occurrence;task.answers=structuredClone(parent.answers||[]);tasks.push(task);created.push(task);
  }
  // Coalesce missed runs after downtime instead of flooding the queue.
  s.nextRunAt=nextOccurrence(recurrenceSpec(s),now);
 }
 return created;
}
