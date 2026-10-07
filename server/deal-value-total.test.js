import test from 'node:test';import assert from 'node:assert/strict';import {totalDealValue} from '../src/deal-value.js';
const item=(url,valueUsd,status='ready',extra={})=>({status,offer:{url,valueUsd,...extra}});
test('total value counts unique ready consumer deals only',()=>{
 assert.equal(totalDealValue([item('https://example.com/a',40),item('https://example.com/a',40),item('https://example.com/b',60),item('https://example.com/c',100,'cancelled'),item('https://example.com/d',100,'queued'),item('https://example.com/e',100,'ready',{expired:true}),item('https://example.com/past',50,'ready',{startsAt:'2020-01-01T00:00:00Z',endsAt:'2020-01-02T00:00:00Z'}),item('https://www.stanthonysf.org/',100)]),100);
 assert.equal(totalDealValue([item('https://example.com/missing',undefined)]),0);
 assert.equal(totalDealValue([]),0);
});
