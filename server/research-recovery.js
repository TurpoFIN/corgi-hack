import {parseJson} from './domain.js';
import {discoverySchema} from './demo.js';
// Reuse evidence only after the current result contract accepts it.
export function reusableResearch(answer,tools,sourceMissionId){
 if(!answer||typeof answer.output!=='string'||!Array.isArray(tools)||!tools.some(t=>/search/i.test(t.tool)))return null;
 try{discoverySchema.parse(parseJson(answer.output));}catch{return null;}
 return {answer,tools,sourceMissionId};
}
