import test from 'node:test';
import assert from 'node:assert/strict';
import {nextOccurrence,enqueueScheduledTasks} from './recurrence.js';
import {newTask} from './tasks.js';
test('daily, weekdays, weekly and monthly schedules use Pacific wall time',()=>{
 const now=Date.parse('2026-10-09T19:00Z');
 assert.equal(nextOccurrence({frequency:'daily',time:'08:00'},now),'2026-10-10T15:00:00.000Z');
 assert.equal(nextOccurrence({frequency:'weekdays',time:'08:00'},now),'2026-10-12T15:00:00.000Z');
 assert.equal(nextOccurrence({frequency:'weekly',time:'09:00',dayOfWeek:2},now),'2026-10-13T16:00:00.000Z');
 assert.equal(nextOccurrence({frequency:'monthly',time:'08:00',dayOfMonth:31},Date.parse('2026-02-01T20:00Z')),'2026-02-28T16:00:00.000Z');
 assert.equal(nextOccurrence({frequency:'daily',time:'08:00'},Date.parse('2026-10-31T20:00Z')),'2026-11-01T16:00:00.000Z');
});
test('recurrence creates one independent task after downtime and does not duplicate active runs',()=>{
 const created=Date.parse('2026-10-07T20:00Z'),now=Date.parse('2026-10-10T20:00Z');
 const root=newTask({text:'Find free lunch',schedule:{frequency:'daily'}},created);root.status='completed';root.answers=[{question:'Which meal?',answer:'Lunch'}];
 const tasks=[root],factory=input=>newTask(input,now);
 const added=enqueueScheduledTasks(tasks,factory,now);
 assert.equal(added.length,1);assert.equal(tasks.length,2);assert.equal(added[0].scheduleId,root.id);assert.equal(added[0].schedule,undefined);assert.deepEqual(added[0].answers,root.answers);assert.ok(Date.parse(root.schedule.nextRunAt)>now);
 assert.equal(enqueueScheduledTasks(tasks,factory,now+86400000).length,0);
 root.schedule.enabled=false;added[0].status='completed';assert.equal(enqueueScheduledTasks(tasks,factory,now+2*86400000).length,0);
});
test('invalid repeat settings are rejected',()=>{assert.throws(()=>newTask({text:'Find lunch',schedule:{frequency:'daily',time:'25:00'}}));assert.throws(()=>newTask({text:'Find lunch',schedule:{frequency:'weekly',dayOfWeek:8}}));});
