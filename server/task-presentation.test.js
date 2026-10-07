import test from 'node:test';
import assert from 'node:assert/strict';
import {taskSections,taskStage,taskOutcome,completionTime} from '../src/task-presentation.js';
test('today counts Pacific completions, excludes cancelled work, and sorts newest first',()=>{
 const tasks=[{id:'old',status:'completed',finishedAt:'2026-10-07T06:59:00Z'},{id:'today',status:'completed',finishedAt:'2026-10-07T22:00:00Z'},{id:'cancelled',status:'cancelled',finishedAt:'2026-10-07T23:00:00Z'},{id:'active',status:'running'}];
 const s=taskSections(tasks,Date.parse('2026-10-07T23:00:00Z'));
 assert.equal(s.completedToday,1);assert.deepEqual(s.completed.map(t=>t.id),['today','old']);assert.deepEqual(s.open.map(t=>t.id),['active']);
 assert.equal(completionTime(tasks[1].finishedAt,Date.parse('2026-10-07T23:00:00Z')),'Today, 3:00 PM');
});
test('phase badges use only the matching live mission',()=>{
 const task={status:'running',missionId:'a'};
 assert.equal(taskStage(task,{discovery:{id:'a',tools:[{tool:'web_search'}]}}),'Searching');
 assert.equal(taskStage(task,{discovery:{id:'b',tools:[{tool:'web_search'}]}}),'Researching');
 assert.equal(taskStage(task,{mission:{id:'a',current:'booking'}}),'Arranging');
 assert.equal(taskStage({...task,status:'queued'},{paused:true}),'Paused');
});
test('result lines distinguish useful discoveries from unverified offers',()=>{
 assert.equal(taskOutcome({opportunities:[{title:'Hygiene Hub',freeVerified:true,priceToday:0}]}),'Found Hygiene Hub');
 assert.equal(taskOutcome({opportunities:[{title:'Discount',freeVerified:false,priceToday:9}]}),'Checked 1 option · no verified free match');
});
test('dismissed completions leave recent list but remain counted for today',()=>{
 const t={status:'completed',finishedAt:'2026-10-07T22:00:00Z',dismissedAt:'2026-10-07T22:01:00Z'};
 const s=taskSections([t],Date.parse('2026-10-07T23:00:00Z'));assert.equal(s.completed.length,0);assert.equal(s.completedToday,1);
});
test('completed result cards expose benefit, source timing and the next step',async()=>{
 const {completedTaskCard}=await import('../src/task-presentation.js');
 const card=completedTaskCard({opportunities:[{title:'Hygiene Hub',freeVerified:true,priceToday:0,benefits:[{label:'Free shower access'}],schedule:'Sign-ups begin at 6am.',terms:'Sign up at St. Boniface Church before accessing showers.',venue:'150 Golden Gate Avenue; sign-up at 133 Golden Gate Avenue',url:'https://example.com/shower'}]});
 assert.equal(card.headline,'Free shower access');assert.equal(card.next,'Sign up in person at 6am');assert.equal(card.action,'Directions');assert.match(decodeURIComponent(card.href),/133 Golden Gate Avenue, San Francisco, CA/);
 assert.equal(completedTaskCard({opportunities:[]}).action,'Search more broadly');
});
