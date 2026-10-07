import {consumerOpportunity} from './opportunity-policy.js';
export function totalDealValue(bookings=[],now=Date.now()){
 const values=new Map();
 for(const {status,offer} of bookings){
  if(status!=='ready'||!offer||offer.expired||!consumerOpportunity(offer)||!Number.isFinite(offer.valueUsd)||offer.valueUsd<=0)continue;
  if(offer.startsAt&&Date.parse(offer.endsAt||offer.startsAt)<now)continue;
  values.set(offer.url,offer.valueUsd);
 }
 return [...values.values()].reduce((sum,value)=>sum+value,0);
}
