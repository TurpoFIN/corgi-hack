import {z} from 'zod';
export const dealValueSchema=z.number().int().min(1).max(10000);
export const dealValuesInput=z.object({values:z.array(z.object({url:z.url(),valueUsd:dealValueSchema}).strict()).min(1).max(250)}).strict();
export function applyDealValues(state,input){
 const {values}=dealValuesInput.parse(input);
 const offers=[...(state.bookings||[]).map(j=>j.offer),...(state.demo?.opportunities||[]),...(state.tasks||[]).flatMap(t=>t.opportunities||[]),...(state.missionArchive||[]).flatMap(m=>m.opportunities||[]),...(state.results||[])].filter(Boolean);
 const urls=new Set(offers.map(o=>o.url));
 if(values.some(v=>!urls.has(v.url)))throw Object.assign(Error('A deal URL was not found.'),{status:400});
 const byUrl=new Map(values.map(v=>[v.url,v.valueUsd]));
 for(const offer of offers)if(byUrl.has(offer.url))offer.valueUsd=byUrl.get(offer.url);
 return {updated:byUrl.size};
}
