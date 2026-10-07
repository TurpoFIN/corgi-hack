import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {recurrenceInput,nextOccurrence} from './recurrence.js';
export const taskInput=z.object({text:z.string().trim().min(3).max(1200),schedule:recurrenceInput.nullable().optional()}).strict();
export const taskAnswer=z.object({answer:z.string().trim().min(1).max(1200)}).strict();
export const questionSchema=z.object({prompt:z.string().trim().min(5).max(400),choices:z.array(z.string().trim().min(1).max(100)).max(4).default([])}).strict();
export function newTask(input,now=Date.now()){const {text,schedule}=taskInput.parse(input);return {id:randomUUID(),text,status:'queued',createdAt:new Date(now).toISOString(),answers:[],question:null,...(schedule?{schedule:{...schedule,enabled:true,nextRunAt:nextOccurrence(schedule,now)}}:{})};}
export function answerTask(task,input){
 if(task.status!=='needs_input'||!task.question)throw Object.assign(Error('This task is not waiting for an answer.'),{status:409});
 const {answer}=taskAnswer.parse(input);task.answers.push({question:task.question.prompt,answer});task.question=null;task.status='queued';task.error=null;return task;
}
export function taskInstruction(task){return `Complete this specific task for the user, rather than a general weekly search: ${task.text}\nUse previous answers. Do not repeat a question already answered. Previous clarifications: ${JSON.stringify(task.answers)}\nIf a necessary detail is missing, return ONLY {"question":{"prompt":"one concise question","choices":["up to four useful options"]}}. Empty choices permits free text. Do not invent an answer. If the task can proceed using saved preferences, proceed without asking. Ask at most one question at a time. If the user explicitly asks you to ask a question first and no clarification has yet been answered, honor that. Once answered, research only the requested need; do not pad it with unrelated categories. Otherwise return the research JSON described above. Do not claim you performed provider actions you did not perform.`;}
export const taskDismissInput=z.object({ids:z.array(z.string().min(1).max(100)).min(1).max(500),dismissed:z.boolean().default(true)}).strict();
export function setTaskDismissal(tasks,input,now=new Date().toISOString()){
 const {ids,dismissed}=taskDismissInput.parse(input);
 const targets=[...new Set(ids)].map(id=>{const task=tasks.find(t=>t.id===id);if(!task)throw Object.assign(Error('Task not found.'),{status:404});if(task.status!=='completed')throw Object.assign(Error('Only completed tasks can be dismissed.'),{status:409});return task});
 for(const task of targets){if(dismissed)task.dismissedAt??=now;else delete task.dismissedAt;}
 return targets;
}
