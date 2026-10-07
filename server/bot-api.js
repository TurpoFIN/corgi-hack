import express from 'express';
import {z} from 'zod';
import {authorized} from './api-access.js';
import {conciergeApi} from './concierge.js';
import {profileSchema} from './profile.js';
const missionInput=z.object({instruction:z.string().trim().max(1200).default('')}).strict();
const jsonResponse={description:'Success',content:{'application/json':{schema:{type:'object'}}}};
const operation=(operationId,summary,extra={})=>({operationId,summary,responses:{200:jsonResponse,401:{description:'API key required'},409:{description:'Conflicting request'}},...extra});
const idParam={name:'id',in:'path',required:true,schema:{type:'string'}};
export const openapi={openapi:'3.1.0',info:{title:'Free SF Agent API',version:'1.0.0',description:'Give your bot a San Francisco life concierge. Start asynchronous missions and read source-backed plans using the same profile and Agent37 computer as the app.'},servers:[{url:'/api/v1'}],security:[{bearerAuth:[]}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}},schemas:{Profile:z.toJSONSchema(profileSchema)}},paths:{
 '/status':{get:operation('getStatus','Read agent availability and current mission')},
 '/profile':{get:operation('getProfile','Read the saved user profile'),patch:operation('updateProfile','Update preferences and sync the Agent37 notebook',{requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(profileSchema.partial())}}}})},
 '/missions':{post:operation('startMission','Find and arrange opportunities asynchronously',{parameters:[{name:'Idempotency-Key',in:'header',schema:{type:'string',maxLength:128}}],requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(missionInput)}}},responses:{202:jsonResponse,400:{description:'Profile required'},401:{description:'API key required'},409:{description:'Agent busy or conflicting idempotency key'}}})},
 '/missions/{id}':{get:operation('getMission','Poll mission status and researched opportunities',{parameters:[idParam]})},
 '/missions/{id}/cancel':{post:operation('cancelMission','Request the current mission to stop',{parameters:[idParam]})},
 '/plans':{get:operation('getPlans','List persistent plans, benefits, and job states')},
 '/plans/{id}/remove':{post:operation('removePlan','Remove a plan from the personal week',{parameters:[idParam]})},
 '/plans/{id}/restore':{post:operation('restorePlan','Restore a removed plan to the queue',{parameters:[idParam]})},
 '/memory':{get:operation('readNotebook','Read PROFILE.md and NOTES.md from Agent37')},
 '/calendar.ics':{get:operation('exportCalendar','Export ready event plans as tentative calendar entries',{responses:{200:{description:'Calendar',content:{'text/calendar':{schema:{type:'string'}}}}}})}
}};
export function registerBotApi(app){
 const router=express.Router();
 router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 router.get('/openapi.json',(_req,res)=>res.json(openapi));
 router.use((req,res,next)=>{if(!authorized(req.get('authorization')))return res.status(401).json({error:{code:'unauthorized',message:'A valid Bearer API key is required.'}});next();});
 const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
 router.get('/status',(_req,res)=>res.json(conciergeApi.status()));
 router.get('/profile',(_req,res)=>res.json(conciergeApi.profile()));
 router.patch('/profile',wrap(async(req,res)=>res.json(await conciergeApi.updateProfile(req.body))));
 router.post('/missions',wrap(async(req,res)=>{const input=missionInput.parse(req.body);const key=req.get('idempotency-key');if(key)z.string().min(1).max(128).parse(key);const mission=await conciergeApi.start({...input,idempotencyKey:key});res.status(202).set('Location','/api/v1/missions/'+mission.id).set('Retry-After','2').json(mission);}));
 router.get('/missions/:id',wrap((req,res)=>res.json(conciergeApi.mission(req.params.id))));
 router.post('/missions/:id/cancel',wrap(async(req,res)=>res.json(await conciergeApi.cancel(req.params.id))));
 router.get('/plans',(_req,res)=>res.json({plans:conciergeApi.plans()}));
 for(const action of ['remove','restore'])router.post('/plans/:id/'+action,wrap(async(req,res)=>res.json(await conciergeApi.changePlan(req.params.id,action))));
 router.get('/memory',wrap(async(_req,res)=>res.json(await conciergeApi.memory())));
 router.get('/calendar.ics',(_req,res)=>res.type('text/calendar').attachment('free-sf-week.ics').send(conciergeApi.calendar()));
 router.use((_req,res)=>res.status(404).json({error:{code:'not_found',message:'API endpoint not found.'}}));
 router.use((e,_req,res,_next)=>res.status(e instanceof z.ZodError?400:e.status||500).json({error:{code:e instanceof z.ZodError?'invalid_request':'request_failed',message:e instanceof z.ZodError?'Check request fields against the OpenAPI schema.':e.message}}));
 app.use('/api/v1',router);
}
