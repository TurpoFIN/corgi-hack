import test from 'node:test';import assert from 'node:assert/strict';
import {applyDealValues,dealValueSchema} from './deal-values.js';
import {benefitContextSchema} from './benefits.js';
test('agent value survives validation and propagates without altering actual cost or evidence',()=>{
 const offer=()=>({url:'https://example.com/event',priceToday:0,priceEvidence:'Free admission'});
 const state={bookings:[{offer:offer()}],tasks:[{opportunities:[offer()]}],demo:{opportunities:[offer()]},missionArchive:[{opportunities:[offer()]}]};
 assert.deepEqual(applyDealValues(state,{values:[{url:'https://example.com/event',valueUsd:45}]}),{updated:1});
 for(const o of [state.bookings[0].offer,state.tasks[0].opportunities[0],state.demo.opportunities[0],state.missionArchive[0].opportunities[0]]){assert.equal(o.valueUsd,45);assert.equal(o.priceToday,0);assert.equal(o.priceEvidence,'Free admission');}
 assert.equal(benefitContextSchema.parse({valueUsd:45}).valueUsd,45);
});
test('invalid values and unknown targets are rejected before mutation',()=>{
 for(const n of [-1,0,1.5,10001,Infinity])assert.equal(dealValueSchema.safeParse(n).success,false);
 const state={bookings:[{offer:{url:'https://example.com/a'}}]};
 assert.throws(()=>applyDealValues(state,{values:[{url:'https://example.com/a',valueUsd:20},{url:'https://example.com/missing',valueUsd:50}]}));assert.equal(state.bookings[0].offer.valueUsd,undefined);
});
