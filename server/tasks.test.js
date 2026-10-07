import test from 'node:test';
import assert from 'node:assert/strict';
import {newTask,answerTask,taskInstruction,questionSchema} from './tasks.js';
test('tasks retain free text, choices and clarification across resume',()=>{const t=newTask({text:'Find a workout'});t.status='needs_input';t.question=questionSchema.parse({prompt:'Which workout?',choices:['Yoga','Weights']});answerTask(t,{answer:'Yoga, after 5 pm'});assert.equal(t.status,'queued');assert.equal(t.question,null);assert.ok(taskInstruction(t).includes('Yoga, after 5 pm'));assert.throws(()=>answerTask(t,{answer:'Again'}));});
test('empty requests and unbounded choice lists are rejected',()=>{assert.throws(()=>newTask({text:' '}));assert.throws(()=>questionSchema.parse({prompt:'Which?',choices:['a','b','c','d','e']}));});
test('dismissal is reversible and preserves completed status and results',async()=>{
 const {setTaskDismissal}=await import('./tasks.js');const tasks=[{id:'done',status:'completed',result:'Found lunch'},{id:'open',status:'running'}];
 assert.throws(()=>setTaskDismissal(tasks,{ids:['done','open']}));assert.equal(tasks[0].dismissedAt,undefined);
 setTaskDismissal(tasks,{ids:['done']},'2026-10-07T22:00:00Z');assert.equal(tasks[0].status,'completed');assert.equal(tasks[0].result,'Found lunch');assert.ok(tasks[0].dismissedAt);
 setTaskDismissal(tasks,{ids:['done'],dismissed:false});assert.equal(tasks[0].dismissedAt,undefined);
});
