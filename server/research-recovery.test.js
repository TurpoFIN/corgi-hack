import test from 'node:test';
import assert from 'node:assert/strict';
import {reusableResearch} from './research-recovery.js';
const offer={title:'Community service',category:'Fitness',url:'https://example.com/service',venue:'SF',schedule:'Weekdays',startsAt:null,endsAt:null,priceToday:0,priceEvidence:'Free service',sourceEvidence:'Free service for the community',terms:'Walk in',renewal:null,eligibility:'Public',kind:'offer',freeVerified:true,benefitCaveat:'In-person signup is required. '.repeat(12)};
const answer={output:JSON.stringify({summary:'Found a service',opportunities:[offer]})};
test('cached recovery requires live search evidence and currently valid source data',()=>{
 const tools=[{tool:'web_search'}];
 assert.equal(reusableResearch(answer,tools,'source-id').answer,answer);
 assert.equal(reusableResearch(answer,[],'source-id'),null);
 assert.equal(reusableResearch({output:'broken'},tools,'source-id'),null);
 assert.equal(reusableResearch({output:JSON.stringify({summary:'Invalid price',opportunities:[{...offer,priceToday:-1}]})},tools,'source-id'),null);
});
