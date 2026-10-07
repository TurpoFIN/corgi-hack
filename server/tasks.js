import {randomUUID} from 'node:crypto';
import {z} from 'zod';
export const taskInput=z.object({text:z.string().trim().min(3).max(1200)}).strict();
export const taskAnswer=z.object({answer:z.string().trim().min(1).max(1200)}).strict();
export const questionSchema=z.object({prompt:z.string().trim().min(5).max(400),choices:z.array(z.string().trim().min(1).max(100)).max(4).default([])}).strict();
export function newTask(input){return {id:randomUUID(),text:taskInput.parse(input).text,status:'queued',createdAt:new Date().toISOString(),answers:[],question:null};}
export function answerTask(task,input){
 if(task.status!=='needs_input'||!task.question)throw Object.assign(Error('This task is not waiting for an answer.'),{status:409});
 const {answer}=taskAnswer.parse(input);task.answers.push({question:task.question.prompt,answer});task.question=null;task.status='queued';task.error=null;return task;
}
export function taskInstruction(task){return `Complete this specific task for the user, rather than a general weekly search: ${task.text}\nUse previous answers. Do not repeat a question already answered. Previous clarifications: ${JSON.stringify(task.answers)}\nIf a necessary detail is missing, return ONLY {"question":{"prompt":"one concise question","choices":["up to four useful options"]}}. Empty choices permits free text. Do not invent an answer. If the task can proceed using saved preferences, proceed without asking. Ask at most one question at a time. If the user explicitly asks you to ask a question first and no clarification has yet been answered, honor that. Once answered, research only the requested need; do not pad it with unrelated categories. Otherwise return the research JSON described above. Do not claim you performed provider actions you did not perform.`;}
