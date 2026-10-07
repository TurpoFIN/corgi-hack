import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('Monid VM helper refuses variable-price and over-budget dispatches',()=>{
 const script=`import importlib.util,tempfile,pathlib,json,sys
spec=importlib.util.spec_from_file_location('monid','server/monid-vm.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
 m.ROOT=pathlib.Path(tmp);m.CONFIG=m.ROOT/'monid-config.json';m.CONFIG.write_text(json.dumps({'key':'test-only','mission':'a'}))
 calls=[]
 def request(path,data=None):
  calls.append(path)
  return {'price':{'type':'PER_CALL','amount':0.1,'currency':'USD'}} if path=='/v1/inspect' else {'runId':'r','status':'COMPLETED','providerResponse':{'httpStatus':200}}
 m.request=request;sys.argv=['client','run',json.dumps({'provider':'p','endpoint':'/e','input':{}})]
 m.main();m.main()
 try: m.main();raise AssertionError('overspent')
 except ValueError: pass
 assert calls.count('/v1/run')==2
 m.request=lambda path,data=None:{'price':{'type':'PER_RESULT','amount':0.001,'currency':'USD'}}
 try:m.main();raise AssertionError('variable pricing passed')
 except ValueError:pass
`;
 const result=spawnSync('python3',['-c',script],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
