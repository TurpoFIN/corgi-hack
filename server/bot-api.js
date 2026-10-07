import express from 'express';
import {z} from 'zod';
import {authorized} from './api-access.js';
import {agentGuide} from './agent-guide.js';
import {profileSchema} from './profile.js';
import {taskInput,taskAnswer,taskDismissInput} from './tasks.js';
const notesInput=z.object({notes:z.string().max(20000)}).strict();
const scheduleToggle=z.object({enabled:z.boolean()}).strict();
const queueInput=z.object({paused:z.boolean()}).strict();
const connectionInput=z.object({toolkit:z.enum(['gmail','googlecalendar'])}).strict();
const bodySchema=schema=>({required:true,content:{'application/json':{schema:z.toJSONSchema(schema)}}});
const idempotencyParam={name:'Idempotency-Key',in:'header',schema:{type:'string',minLength:1,maxLength:128}};
const missionInput=z.object({instruction:z.string().trim().max(1200).default('')}).strict();
const jsonResponse={description:'Success',content:{'application/json':{schema:{type:'object'}}}};
const operation=(operationId,summary,extra={})=>({operationId,summary,responses:{200:jsonResponse,401:{description:'API key required'},409:{description:'Conflicting request'}},...extra});
const sourceQuery=z.object({category:z.string().max(80).optional(),q:z.string().max(160).optional()}).strict();
const idParam={name:'id',in:'path',required:true,schema:{type:'string'}};
export const openapi={openapi:'3.1.0',info:{title:'Free SF Agent API',version:'1.0.0',description:'Give your bot a San Francisco life concierge. Queue autonomous tasks, answer clarifications, manage the notebook and read source-backed plans using the same profile and Agent37 computer as the app.'},servers:[{url:'/api/v1'}],security:[{bearerAuth:[]}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}},schemas:{Profile:z.toJSONSchema(profileSchema)}},paths:{
 '/tasks':{get:operation('listTasks','Read the autonomous task queue'),post:operation('addTask','Queue a task for Scout',{parameters:[idempotencyParam],requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(taskInput)}}},responses:{202:jsonResponse}})},
 '/tasks/{id}/answer':{post:operation('answerTask','Answer a task clarification and resume it',{parameters:[idParam],requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(taskAnswer)}}},responses:{202:jsonResponse}})},
 '/tasks/{id}/schedule':{patch:operation('setTaskSchedule','Pause or resume future scheduled runs',{parameters:[idParam],requestBody:bodySchema(scheduleToggle)})},
 '/tasks/dismiss':{post:operation('dismissTasks','Dismiss or restore completed tasks without deleting results',{requestBody:bodySchema(taskDismissInput)})},
 '/tasks/{id}':{get:operation('getTask','Read task status, clarification, answers, results and source evidence',{parameters:[idParam]})},
 '/tasks/{id}/retry':{post:operation('retryTask','Requeue a failed, paused or cancelled task',{parameters:[idParam]})},
 '/tasks/{id}/cancel':{post:operation('cancelTask','Cancel a queued, waiting or active task',{parameters:[idParam]})},
 '/tasks/queue':{get:operation('getTaskQueue','Read queue state'),patch:operation('setTaskQueue','Pause active work or resume paused work and drain queued tasks',{requestBody:bodySchema(queueInput)})},
 '/sources':{get:operation('getSourceMap','Read Scout’s categorized research routes, URLs and verification targets',{parameters:[{name:'category',in:'query',schema:{type:'string'}},{name:'q',in:'query',schema:{type:'string',maxLength:160}}]})},
 '/status':{get:operation('getStatus','Read agent availability and current mission')},
 '/profile':{get:operation('getProfile','Read the saved user profile'),patch:operation('updateProfile','Update preferences and sync the Agent37 notebook',{requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(profileSchema.partial())}}}})},
 '/missions':{post:operation('startMission','Find and arrange opportunities asynchronously',{parameters:[{name:'Idempotency-Key',in:'header',schema:{type:'string',maxLength:128}}],requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(missionInput)}}},responses:{202:jsonResponse,400:{description:'Profile required'},401:{description:'API key required'},409:{description:'Agent busy or conflicting idempotency key'}}})},
 '/missions/{id}':{get:operation('getMission','Poll mission status and researched opportunities',{parameters:[idParam]})},
 '/missions/{id}/cancel':{post:operation('cancelMission','Request the current mission to stop',{parameters:[idParam]})},
 '/day-plan':{get:operation('getDayPlan','Read the scheduled daily itinerary, meals, workouts and source evidence')},
 '/day-plan/{id}/remove':{post:operation('removeDayItem','Remove a scheduled itinerary item',{parameters:[idParam]})},
 '/day-plan/{id}/restore':{post:operation('restoreDayItem','Restore a removed itinerary item when still eligible',{parameters:[idParam]})},
 '/plans/resume':{post:operation('resumePlans','Continue arranging plans from the latest search')},
 '/plans':{get:operation('getPlans','List persistent plans, benefits, and job states')},
 '/plans/{id}/remove':{post:operation('removePlan','Remove a plan from the personal week',{parameters:[idParam]})},
 '/plans/{id}/restore':{post:operation('restorePlan','Restore a removed plan to the queue',{parameters:[idParam]})},
 '/memory':{get:operation('readNotebook','Read PROFILE.md and NOTES.md from Agent37')},
 '/memory/notes':{put:operation('writeNotes','Replace NOTES.md on Agent37; pause active work first',{requestBody:bodySchema(notesInput)})},
 '/memory/sync':{post:operation('syncProfileNotebook','Sync saved profile into Agent37 PROFILE.md')},
 '/connections':{get:operation('listConnections','Read connected Google accounts'),post:operation('connectAccount','Create a provider authorization URL',{requestBody:bodySchema(connectionInput)})},
 '/calendar.ics':{get:operation('exportCalendar','Export ready event plans as tentative calendar entries',{responses:{200:{description:'Calendar',content:{'text/calendar':{schema:{type:'string'}}}}}})}
}};
// Explicit response contracts let tool-capable agents inspect outcomes without UI heuristics.
Object.assign(openapi.components.schemas,{
 Task:{type:'object',required:['id','text','status'],properties:{id:{type:'string'},text:{type:'string'},status:{type:'string',enum:['queued','running','needs_input','completed','paused','failed','cancelled']},question:{anyOf:[{$ref:'#/components/schemas/Question'},{type:'null'}]},answers:{type:'array',items:{type:'object',properties:{question:{type:'string'},answer:{type:'string'}}}},result:{type:['string','null']},error:{type:['string','null']},opportunities:{type:'array',items:{type:'object'}},coverage:{$ref:'#/components/schemas/Coverage'},recurrence:{type:['object','null'],properties:{frequency:{type:'string',enum:['daily','weekdays','weekly','monthly']},enabled:{type:'boolean'},time:{type:'string'},nextRunAt:{type:'string',format:'date-time'}}},dismissedAt:{type:'string',format:'date-time'},scheduleId:{type:'string'},scheduledFor:{type:'string',format:'date-time'},createdAt:{type:'string',format:'date-time'},finishedAt:{type:['string','null'],format:'date-time'}}},
 Question:{type:'object',required:['prompt','choices'],properties:{prompt:{type:'string'},choices:{type:'array',items:{type:'string'},maxItems:4}}},
 Coverage:{type:'object',properties:{catalogVersion:{type:['string','null']},mapped:{type:['integer','null']},searched:{type:'integer'},opened:{type:'integer'},limited:{type:'boolean'},providers:{type:'array',items:{type:'object',properties:{id:{type:'string'},name:{type:'string'},domain:{type:'string'},searched:{type:'boolean'},opened:{type:'boolean'},urls:{type:'array',items:{type:'string'}},results:{type:'integer'},freeMatches:{type:'integer'}}}}}}
});
const taskResponse={description:'Task state; inspect status and coverage before claiming success',content:{'application/json':{schema:{$ref:'#/components/schemas/Task'}}}};
for(const [path,method,code] of [['/tasks','post',202],['/tasks/{id}','get',200],['/tasks/{id}/answer','post',202],['/tasks/{id}/retry','post',200],['/tasks/{id}/cancel','post',200],['/tasks/{id}/schedule','patch',200]])openapi.paths[path][method].responses[code]=taskResponse;
openapi.paths['/tasks'].get.responses[200]={description:'Task queue and persisted results',content:{'application/json':{schema:{type:'object',required:['tasks','paused','active_task_id'],properties:{tasks:{type:'array',items:{$ref:'#/components/schemas/Task'}},paused:{type:'boolean'},active_task_id:{type:['string','null']}}}}}};
export function registerBotApi(app,{api,authenticate=authorized}){
 const router=express.Router();
 router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 router.get('/openapi.json',(_req,res)=>res.json(openapi));
 router.get('/agent.md',(_req,res)=>res.type('text/markdown').send(agentGuide));
 router.use((req,res,next)=>{if(!authenticate(req.get('authorization')))return res.status(401).json({error:{code:'unauthorized',message:'A valid Bearer API key is required.'}});next();});
 const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
 router.get('/tasks',(_req,res)=>res.json({tasks:api.tasks(),...api.taskQueue()}));
 router.get('/tasks/queue',(_req,res)=>res.json(api.taskQueue()));
 router.patch('/tasks/queue',wrap(async(req,res)=>res.json(await api.setTaskQueue(queueInput.parse(req.body).paused))));
 router.get('/tasks/:id',wrap((req,res)=>res.json(api.task(req.params.id))));
 for(const action of ['retry','cancel'])router.post('/tasks/:id/'+action,wrap(async(req,res)=>res.json(await api[action+'Task'](req.params.id))));
 router.patch('/tasks/:id/schedule',wrap(async(req,res)=>res.json(await api.setTaskSchedule(req.params.id,scheduleToggle.parse(req.body)))));
 router.post('/tasks/dismiss',wrap(async(req,res)=>res.json(await api.dismissTasks(taskDismissInput.parse(req.body)))));
 router.post('/tasks',wrap(async(req,res)=>{const key=req.get('idempotency-key');if(key)z.string().min(1).max(128).parse(key);const task=await api.addTask(taskInput.parse(req.body),{idempotencyKey:key});res.status(202).set('Location','/api/v1/tasks/'+task.id).set('Retry-After','2').json(task);}));
 router.post('/tasks/:id/answer',wrap(async(req,res)=>res.status(202).json(await api.answerTask(req.params.id,taskAnswer.parse(req.body)))));
 router.get('/sources',wrap((req,res)=>{const {category,q}=sourceQuery.parse(req.query);const catalog=api.sources();if(category&&!Object.hasOwn(catalog.categories,category))throw Object.assign(Error('Unknown source category.'),{status:400});const query=q?.toLowerCase();const sources=catalog.sources.filter(s=>(!category||s.category===category)&&(!query||[s.name,s.domain,s.target].some(value=>value?.toLowerCase().includes(query))));res.json({...catalog,sources,total:catalog.sources.length,matched:sources.length});}));
 router.get('/status',(_req,res)=>res.json(api.status()));
 router.get('/profile',(_req,res)=>res.json(api.profile()));
 router.patch('/profile',wrap(async(req,res)=>res.json(await api.updateProfile(req.body))));
 router.post('/missions',wrap(async(req,res)=>{const input=missionInput.parse(req.body);const key=req.get('idempotency-key');if(key)z.string().min(1).max(128).parse(key);const mission=await api.start({...input,idempotencyKey:key});res.status(202).set('Location','/api/v1/missions/'+mission.id).set('Retry-After','2').json(mission);}));
 router.get('/missions/:id',wrap((req,res)=>res.json(api.mission(req.params.id))));
 router.post('/missions/:id/cancel',wrap(async(req,res)=>res.json(await api.cancel(req.params.id))));
 router.get('/day-plan',(_req,res)=>res.json(api.dayPlan()));
 for(const action of ['remove','restore'])router.post('/day-plan/:id/'+action,wrap(async(req,res)=>res.json(await api.changeDayItem(req.params.id,action))));
 router.post('/plans/resume',wrap(async(_req,res)=>res.status(202).json(await api.resumePlans())));
 router.get('/plans',(_req,res)=>res.json({plans:api.plans()}));
 for(const action of ['remove','restore'])router.post('/plans/:id/'+action,wrap(async(req,res)=>res.json(await api.changePlan(req.params.id,action))));
 router.get('/memory',wrap(async(_req,res)=>res.json(await api.memory())));
 router.put('/memory/notes',wrap(async(req,res)=>res.json(await api.updateNotes(notesInput.parse(req.body)))));
 router.post('/memory/sync',wrap(async(_req,res)=>res.json(await api.syncMemory())));
 router.get('/connections',wrap(async(_req,res)=>res.json(await api.connections())));
 router.post('/connections',wrap(async(req,res)=>res.json(await api.connect(connectionInput.parse(req.body)))));
 router.get('/calendar.ics',(_req,res)=>res.type('text/calendar').attachment('free-sf-week.ics').send(api.calendar()));
 router.use((_req,res)=>res.status(404).json({error:{code:'not_found',message:'API endpoint not found.'}}));
 router.use((e,_req,res,_next)=>res.status(e instanceof z.ZodError?400:e.status||500).json({error:{code:e instanceof z.ZodError?'invalid_request':'request_failed',message:e instanceof z.ZodError?'Check request fields against the OpenAPI schema.':e.message}}));
 app.use('/api/v1',router);
}
