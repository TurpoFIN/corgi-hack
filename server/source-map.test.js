import test from 'node:test';
import assert from 'node:assert/strict';
import {sources,researchPlan,sourceCoverage,needsExpansion} from './source-map.js';
test('catalog ids and URLs are valid; targeted plan crosses independent providers',()=>{
 assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
 for(const source of sources)assert.equal(new URL(source.url).protocol,'https:');
 const plan=researchPlan('Find strength training tomorrow. Prefer LuxFit.');
 assert.ok(plan.sources.some(s=>s.id==='ymca'));assert.ok(plan.sources.some(s=>s.id==='crunch'));assert.ok(plan.sources.some(s=>s.id==='luxfit'));assert.equal(plan.minimumProviders,6);
});
test('two LuxFit pages are one provider; source catalog itself is not research evidence',()=>{
 const plan=researchPlan('Find a workout');
 const coverage=sourceCoverage([{tool:'read_file',label:'SOURCE_MAP.json'},{tool:'web_extract',label:'https://luxfitsf.com/marketing/3daypass'},{tool:'web_extract',label:'https://luxfitsf.com/locations/hayes-valley'}],[],plan);
 assert.equal(coverage.providers.length,1);assert.equal(coverage.opened,1);assert.equal(coverage.limited,true);assert.equal(needsExpansion([],coverage,plan),true);
});
test('targeted search is distinguished from opening a page; unvisited results do not count',()=>{
 const coverage=sourceCoverage([{tool:'web_search',label:'site:crunch.com free trial SF'},{tool:'web_search',label:'SF free gym'}],[{url:'https://ymcasf.org/',freeVerified:true,priceToday:0}]);
 assert.equal(coverage.providers.length,1);assert.equal(coverage.searched,1);assert.equal(coverage.opened,0);
});
test('weekly plan spreads first routes across categories and respects excluded meals and trials',()=>{
 const all=researchPlan('Plan my week');assert.ok(new Set(all.sources.slice(0,5).map(s=>s.category)).size>=4);
 const restricted=researchPlan('Food workout meal kit subscription',{communityMeals:false,allowTrials:false});assert.ok(!restricted.sources.some(s=>['food','meal-kits','rewards'].includes(s.category)));
});
test('consumer directory excludes assistance providers and food routing covers hosts and rewards',()=>{
 assert.ok(!sources.some(s=>/glide.org|stanthonysf.org|sfmfoodbank.org/.test(s.url)));
 const plan=researchPlan('Find free food for tomorrow');
 assert.ok(plan.sources.some(s=>s.id==='luma'));assert.ok(plan.sources.some(s=>s.id==='partiful'));assert.ok(plan.sources.some(s=>s.id==='peets'));
});
test('showers route to gyms and passes rather than giveaways or assistance',()=>{
 const plan=researchPlan('A place to take a shower');assert.deepEqual(plan.categories,['fitness']);assert.ok(plan.sources.some(s=>s.id==='ymca'));
});
