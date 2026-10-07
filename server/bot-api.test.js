import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {registerBotApi,openapi} from './bot-api.js';

test('agent API authenticates and exposes task controls without owner UI',async t=>{
 const calls=[];const app=express();app.use(express.json());
 const api={tasks:()=>[{id:'task-1',status:'needs_input',question:{prompt:'Which workout?',choices:['Yoga','Weights']}}],taskQueue:()=>({paused:true}),task:id=>({id,status:'needs_input',question:{prompt:'Which workout?',choices:['Yoga']},opportunities:[]}),addTask:async(body,options)=>{calls.push(['add',body,options]);return {id:'task-2',...body,status:'queued'};},answerTask:async(id,body)=>{calls.push(['answer',id,body]);return {id,status:'queued'};},setTaskQueue:async paused=>({paused}),retryTask:async id=>({id,status:'queued'}),cancelTask:async id=>({id,status:'cancelled'}),changeDayItem:async(id,action)=>{calls.push(['day',id,action]);return {items:[]};},updateNotes:async body=>body,connect:async body=>({toolkit:body.toolkit,redirectUrl:'https://provider.example/authorize'})};
 registerBotApi(app,{api,authenticate:h=>h==='Bearer test-key'});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const call=(path,method='GET',body,headers={})=>fetch(base+path,{method,headers:{Authorization:'Bearer test-key','Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await fetch(base+'/tasks')).status,401);
 assert.equal((await fetch(base+'/openapi.json')).status,200);
 const list=await (await call('/tasks')).json();assert.equal(list.paused,true);assert.equal(list.tasks[0].question.choices[1],'Weights');
 const add=await call('/tasks','POST',{text:'Find yoga'},{'Idempotency-Key':'task-once'});assert.equal(add.status,202);assert.equal(add.headers.get('location'),'/api/v1/tasks/task-2');assert.deepEqual(calls[0],['add',{text:'Find yoga'},{idempotencyKey:'task-once'}]);
 assert.equal((await call('/tasks','POST',{text:''})).status,400);
 assert.equal((await call('/tasks/task-1')).status,200);
 assert.equal((await call('/tasks/task-1/answer','POST',{answer:'Yoga'})).status,202);
 assert.equal((await call('/tasks/task-1/answer','POST',{answer:''})).status,400);
 assert.equal((await (await call('/tasks/queue')).json()).paused,true);
 assert.equal((await (await call('/tasks/queue','PATCH',{paused:false})).json()).paused,false);
 assert.equal((await call('/tasks/queue','PATCH',{paused:'false'})).status,400);
 assert.equal((await (await call('/tasks/task-1/cancel','POST')).json()).status,'cancelled');
 assert.equal((await (await call('/tasks/task-1/retry','POST')).json()).status,'queued');
 for(const action of ['remove','restore'])assert.equal((await call('/day-plan/visit-1/'+action,'POST')).status,200);
 assert.deepEqual(calls.filter(c=>c[0]==='day'),[['day','visit-1','remove'],['day','visit-1','restore']]);
 assert.deepEqual(await(await call('/memory/notes','PUT',{notes:'# Notes\nLikes swimming'})).json(),{notes:'# Notes\nLikes swimming'});
 assert.equal((await call('/memory/notes','PUT',{notes:'x',profile:'cannot overwrite'})).status,400);
 assert.equal((await call('/connections','POST',{toolkit:'unknown'})).status,400);
 assert.equal((await call('/connections','POST',{toolkit:'googlecalendar'})).status,200);
});

test('OpenAPI covers the autonomous task and notebook controls',()=>{
 for(const path of ['/tasks','/tasks/{id}','/tasks/queue','/tasks/{id}/answer','/tasks/{id}/retry','/tasks/{id}/cancel','/day-plan/{id}/remove','/day-plan/{id}/restore','/memory/notes','/memory/sync','/connections','/plans/resume'])assert.ok(openapi.paths[path],path);
});
test('API accepts and preserves repeat schedules for autonomous tasks',async t=>{
 const {newTask}=await import('./tasks.js');
 const app=express();app.use(express.json());registerBotApi(app,{authenticate:()=>true,api:{addTask:async input=>newTask(input,Date.parse('2026-10-07T22:00Z'))}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Find a free lunch',schedule:{frequency:'weekly',time:'09:00',dayOfWeek:2}})});
 assert.equal(response.status,202);const task=await response.json();assert.equal(task.schedule.frequency,'weekly');assert.equal(task.schedule.nextRunAt,'2026-10-13T16:00:00.000Z');assert.equal(task.status,'queued');
});

test('agents discover filtered sources and workflow without loading the app',async t=>{
 const {sources,CATEGORIES,SOURCE_MAP_VERSION}=await import('./source-map.js');
 const app=express();app.use(express.json());registerBotApi(app,{authenticate:h=>h==='Bearer test-key',api:{sources:()=>({version:SOURCE_MAP_VERSION,categories:CATEGORIES,sources})}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const guide=await fetch(base+'/agent.md');assert.equal(guide.status,200);const text=await guide.text();assert.match(text,/needs_input/);assert.match(text,/Idempotency-Key/);assert.doesNotMatch(text,/fsf_[a-f0-9]{64}/);
 assert.equal((await fetch(base+'/sources')).status,401);
 const call=path=>fetch(base+path,{headers:{Authorization:'Bearer test-key'}});
 const all=await(await call('/sources')).json();assert.equal(all.total,sources.length);
 const fitness=await(await call('/sources?category=fitness')).json();assert.ok(fitness.matched>5);assert.ok(fitness.sources.every(s=>s.category==='fitness'));assert.equal(fitness.total,all.total);
 const partiful=await(await call('/sources?q=Partiful')).json();assert.ok(partiful.sources.some(s=>s.id==='partiful'));
 assert.equal((await call('/sources?category=nonexistent')).status,400);
 assert.equal((await call('/sources?category[]=fitness')).status,400);
 const taskSchema=openapi.components.schemas.Task;assert.ok(taskSchema.properties.status.enum.includes('needs_input'));assert.ok(taskSchema.properties.coverage);assert.equal(openapi.paths['/tasks/{id}'].get.responses[200].content['application/json'].schema.$ref,'#/components/schemas/Task');
});
