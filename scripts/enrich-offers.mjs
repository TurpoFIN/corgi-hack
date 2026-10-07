// Apply reviewed, source-backed benefit context to existing records while the app is stopped.
import fs from 'node:fs';
import {benefitContextSchema} from '../server/benefits.js';
import {readDocument,writeDocument} from '../server/insforge.js';
const file=process.argv[2];
if(!file)throw Error('Usage: node scripts/enrich-offers.mjs path/to/reviewed-benefits.json');
let running=false;
try{const r=await fetch(`http://127.0.0.1:${process.env.PORT||5173}/api/concierge`,{signal:AbortSignal.timeout(1000)});running=r.ok;}catch{}
if(running)throw Error('Stop the local app before updating its persisted document.');
const entries=JSON.parse(fs.readFileSync(file,'utf8'));
const reviewed=new Map(Object.entries(entries).map(([url,context])=>[url,benefitContextSchema.parse(context)]));
const state=await readDocument('concierge');
if(!state)throw Error('No existing concierge document.');
fs.mkdirSync('data/backups',{recursive:true});
fs.writeFileSync(`data/backups/benefits-${Date.now()}.json`,JSON.stringify(state,null,2),{mode:0o600});
let updated=0;
for(const offer of [...(state.demo?.opportunities||[]),...(state.bookings||[]).map(j=>j.offer)]){
 const context=reviewed.get(offer.url);if(context){Object.assign(offer,context);updated++;}
}
await writeDocument('concierge',state);
console.log(JSON.stringify({updatedRecords:updated,reviewedSources:reviewed.size}));
