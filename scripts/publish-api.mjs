import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {createGateway} from '../server/api-gateway.js';
const port=Number(process.env.GATEWAY_PORT)||5174;
const gateway=createGateway({port:Number(process.env.PORT)||5173});
await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(port,'127.0.0.1',resolve)});
const child=spawn('cloudflared',['tunnel','--no-autoupdate','--url','http://127.0.0.1:'+port,'--protocol','http2'],{stdio:['ignore','pipe','pipe']});
let url,heartbeat,closing=false;
const files=['data/public-api.json','public/agent-endpoint.json'];
function publish(){if(!url)return;const data=JSON.stringify({baseUrl:url+'/api/v1',expiresAt:Date.now()+90000,processId:process.pid});for(const file of files){fs.writeFileSync(file+'.tmp',data);fs.renameSync(file+'.tmp',file);}}
function output(chunk){const text=String(chunk);const match=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!url){url=match[0];publish();heartbeat=setInterval(publish,30000);console.log('Public agent API: '+url+'/api/v1');}if(/Registered tunnel connection/.test(text))console.log('HTTPS tunnel connected.');}
child.stdout.on('data',output);child.stderr.on('data',output);
function close(code=0){if(closing)return;closing=true;clearInterval(heartbeat);child.kill();gateway.close();for(const file of files)try{fs.unlinkSync(file)}catch{}process.exit(code)}
child.on('error',e=>{console.error(e.message);close(1)});child.on('exit',code=>close(code||0));process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close());
