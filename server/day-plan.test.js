import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDayPlan,atMinute} from './day-plan.js';
const profile={city:'San Francisco',interests:['food','fitness'],allowTrials:true,diet:'No preference',timePreference:'any'};
const now=Date.parse('2026-10-07T22:00:00Z');
const gym={id:'gym',status:'ready',offer:{title:'Y',url:'https://go.ymcasf.org/1-day-pass',freeVerified:true,priceToday:0,kind:'trial'}};
test('calendar uses researched passes once without padding days with service visits',()=>{
 const plan=buildDayPlan([gym],profile,{now});
 assert.equal(plan.items.filter(i=>i.purpose==='fitness').length,1);
 assert.ok(plan.items.some(i=>i.offer.benefits.some(b=>b.icon==='shower')));
 assert.equal(plan.summary.meals,0);
 for(const i of plan.items)assert.ok(Date.parse(i.offer.startsAt)>=now);
 for(let k=1;k<plan.items.length;k++)assert.ok(Date.parse(plan.items[k].offer.startsAt)>=Date.parse(plan.items[k-1].offer.endsAt));
 assert.ok(!plan.items.some(i=>/GLIDE|St. Anthony|Read & recharge/.test(i.offer.title)));
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
 assert.ok(!plan.items.some(i=>i.id==='anthony-lunch-2026-10-08'));assert.equal(plan.items.find(i=>i.id==='event-a').access,'90-min visit');
});
test('Pacific day clock observes daylight saving',()=>{assert.equal(atMinute('2026-10-07',480),'2026-10-07T15:00:00.000Z');assert.equal(atMinute('2026-12-07',480),'2026-12-07T16:00:00.000Z')});
test('a valid planned breakfast visit leaves time for the next event and retains source hours',()=>{
 const breakfast={id:'coffee',status:'ready',offer:{title:'Coffee',freeVerified:true,priceToday:0,startsAt:'2026-10-08T08:00:00-07:00',endsAt:'2026-10-08T10:00:00-07:00',venue:'Cafe',plannedVisit:{startsAt:'2026-10-08T08:00:00-07:00',endsAt:'2026-10-08T08:45:00-07:00'}}};
 const next={id:'next',status:'ready',offer:{title:'Build',freeVerified:true,priceToday:0,startsAt:'2026-10-08T10:00:00-07:00',endsAt:'2026-10-08T12:00:00-07:00',venue:'Studio'}};
 const plan=buildDayPlan([breakfast,next],profile,{now});
 assert.equal(plan.items.length,2);assert.equal(plan.items[0].offer.endsAt,breakfast.offer.plannedVisit.endsAt);assert.equal(plan.items[0].eventWindow.endsAt,breakfast.offer.endsAt);
 breakfast.offer.plannedVisit.endsAt='2026-10-08T11:00:00-07:00';
 assert.equal(buildDayPlan([breakfast,next],profile,{now}).items.length,1);
});
test('retained assistance records never refill the consumer calendar',()=>{
 const assistance={id:'old',status:'ready',offer:{title:'Hygiene Hub',url:'https://www.stanthonysf.org/services/hygiene-hub/',freeVerified:true,priceToday:0,kind:'offer',plannedVisit:{startsAt:'2026-10-08T16:00:00Z',endsAt:'2026-10-08T17:00:00Z',venue:'150 Golden Gate'}}};
 assert.equal(buildDayPlan([assistance],profile,{now}).items.length,0);
});
test('dated food events win over flexible gym suggestions and earlier no-food events',()=>{
 const gymVisit={...gym,offer:{...gym.offer,category:'Fitness',plannedVisit:{startsAt:'2026-10-08T00:30:00Z',endsAt:'2026-10-08T01:30:00Z',venue:'Gym',sourceUrl:'https://example.com',openingHoursEvidence:'Open until 9'}}};
 const event={id:'food',status:'ready',offer:{title:'Builders meet',category:'Events & food',freeVerified:true,priceToday:0,url:'https://example.com/food',startsAt:'2026-10-08T01:00:00Z',endsAt:'2026-10-08T03:00:00Z',venue:'Meetup',benefits:[{icon:'food',label:'Pizza and drinks',evidence:'Pizza provided'}]}};
 const plan=buildDayPlan([gymVisit,event],profile,{now});assert.ok(plan.items.some(j=>j.bookingId==='food'));assert.ok(!plan.items.some(j=>j.bookingId==='gym'));assert.ok(plan.alternatives.some(j=>j.id==='gym'));
});
test('waitlist events remain visible alternatives and never block an available event',()=>{
 const event={id:'wait',status:'ready',offer:{title:'Founder Salon',freeVerified:true,priceToday:0,url:'https://example.com/wait',startsAt:'2026-10-08T17:00:00Z',endsAt:'2026-10-08T20:00:00Z',terms:'Event Full. Join Waitlist.'}};
 const plan=buildDayPlan([event],profile,{now});assert.equal(plan.items.length,0);assert.equal(plan.alternatives[0].access,'Waitlist');
});
test('included food takes precedence over an earlier market with paid vendors',()=>{
 const make=(id,start,end,benefits)=>({id,status:'ready',offer:{title:id,url:'https://example.com/'+id,freeVerified:true,priceToday:0,startsAt:start,endsAt:end,venue:id,benefits}});
 const market=make('market','2026-10-09T17:00:00-07:00','2026-10-09T21:00:00-07:00',[{icon:'food',label:'Food for purchase',evidence:'Paid food vendors'}]);
 const dinner=make('dinner','2026-10-09T18:30:00-07:00','2026-10-09T21:00:00-07:00',[{icon:'food',label:'Food included',evidence:'RSVP includes food and one drink ticket'}]);
 const plan=buildDayPlan([market,dinner],profile,{now});assert.ok(plan.items.some(j=>j.bookingId==='dinner'));assert.ok(plan.alternatives.some(j=>j.id==='market'));
});
