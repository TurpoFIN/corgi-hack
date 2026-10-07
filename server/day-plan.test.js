import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDayPlan,atMinute} from './day-plan.js';
const profile={city:'San Francisco',interests:['food','fitness'],allowTrials:true,diet:'No preference',timePreference:'any'};
const now=Date.parse('2026-10-07T22:00:00Z');
const gym={id:'gym',status:'ready',offer:{title:'Y',url:'https://go.ymcasf.org/1-day-pass',freeVerified:true,priceToday:0,kind:'trial'}};
test('daily plan places meals in real windows and a one-day pass once with shower context',()=>{
 const plan=buildDayPlan([gym],profile,{now});
 assert.equal(plan.items.filter(i=>i.purpose==='fitness').length,1);
 assert.ok(plan.items.some(i=>i.offer.benefits.some(b=>b.icon==='shower')));
 assert.ok(plan.summary.meals>=15);
 for(const i of plan.items)assert.ok(Date.parse(i.offer.startsAt)>=now);
 for(let k=1;k<plan.items.length;k++)assert.ok(Date.parse(plan.items[k].offer.startsAt)>=Date.parse(plan.items[k-1].offer.endsAt));
 const lunch=plan.items.find(i=>i.id.startsWith('anthony-lunch'));assert.equal(lunch.offer.startsAt,'2026-10-08T19:00:00.000Z');
});
test('expired resources, opted out meals, dietary uncertainty and disabled trials are not filled in',()=>{
 assert.equal(buildDayPlan([gym],profile,{now:Date.parse('2026-11-01T12:00Z')}).items.length,0);
 assert.equal(buildDayPlan([gym],{...profile,communityMeals:false,allowTrials:false},{now}).summary.meals,0);
 assert.equal(buildDayPlan([gym],{...profile,allowTrials:false},{now}).summary.workouts,0);
 assert.equal(buildDayPlan([],{...profile,diet:'Vegan'},{now}).summary.meals,0);
});
test('conflicting events are alternatives and removed stops do not return',()=>{
 const event=id=>({id,status:'ready',offer:{freeVerified:true,priceToday:0,startsAt:'2026-10-08T16:00Z',endsAt:'2026-10-08T22:00Z',venue:'Place',url:'https://example.com/'+id}});
 const plan=buildDayPlan([event('a'),event('b')],profile,{now,removed:['glide-dinner-2026-10-07']});
 assert.equal(plan.alternatives.length,1);assert.ok(!plan.items.some(i=>i.id==='glide-dinner-2026-10-07'));
 assert.ok(plan.items.some(i=>i.id==='anthony-lunch-2026-10-08'));assert.equal(plan.items.find(i=>i.id==='event-a').access,'90-min visit');
});
test('Pacific day clock observes daylight saving',()=>{assert.equal(atMinute('2026-10-07',480),'2026-10-07T15:00:00.000Z');assert.equal(atMinute('2026-12-07',480),'2026-12-07T16:00:00.000Z')});
