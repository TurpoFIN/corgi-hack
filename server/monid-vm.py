#!/usr/bin/env python3
"""Scout's bounded Monid client. JSON input/output; credentials never printed."""
import json, sys, urllib.request, urllib.error, pathlib, fcntl, os, math
os.umask(0o077)
ROOT=pathlib.Path('/home/node/free-sf')
CONFIG=ROOT/'monid-config.json'
def request(path, data=None):
    config=json.loads(CONFIG.read_text())
    req=urllib.request.Request('https://api.monid.ai'+path,data=None if data is None else json.dumps(data).encode(),headers={'Authorization':'Bearer '+config['key'],'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=45) as response: return json.load(response)
    except urllib.error.HTTPError as e:
        raise ValueError('Monid HTTP '+str(e.code)) from None

def main():
    action=sys.argv[1]; payload=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
    if action=='discover':
        return request('/v1/discover',{'query':str(payload['query'])[:500],'limit':min(int(payload.get('limit',5)),5)})
    if action=='inspect':
        result=request('/v1/inspect',{'provider':payload['provider'],'endpoint':payload['endpoint']})
        return result
    if action=='run':
        config=json.loads(CONFIG.read_text())
        # Lock covers the reservation and dispatch, preventing concurrent budget reuse.
        with (ROOT/'monid-ledger.json').open('a+') as file:
            fcntl.flock(file,fcntl.LOCK_EX); file.seek(0)
            try: ledger=json.load(file)
            except (ValueError,EOFError): ledger={'mission':config['mission'],'reserved':0,'runs':[]}
            if ledger.get('mission')!=config['mission']: ledger={'mission':config['mission'],'reserved':0,'runs':[]}
            spec=request('/v1/inspect',{'provider':payload['provider'],'endpoint':payload['endpoint']})
            price=spec.get('price',{})
            money=price.get('amount',{})
            amount=money.get('value') if isinstance(money,dict) else money
            currency=money.get('currency') if isinstance(money,dict) else price.get('currency')
            if price.get('type')!='PER_CALL' or currency!='USD' or not isinstance(amount,(int,float)) or not math.isfinite(amount) or amount<0:
                raise ValueError('A fixed USD per-call price is required; choose another endpoint.')
            flat=price.get('flatFee') or 0
            if isinstance(flat,dict):
                if flat.get('currency')!='USD': raise ValueError('Invalid flat fee currency')
                flat=flat.get('value')
            if not isinstance(flat,(int,float)) or not math.isfinite(flat) or flat<0: raise ValueError('Invalid flat fee')
            amount+=flat
            if amount>0.10 or len(ledger['runs'])>=5 or ledger['reserved']+amount>0.25:
                raise ValueError('Monid mission budget reached.')
            ledger['reserved']+=amount
            entry={'provider':payload['provider'],'endpoint':payload['endpoint'],'reservedUSD':amount,'status':'DISPATCHING'}
            ledger['runs'].append(entry)
            file.seek(0);file.truncate();json.dump(ledger,file);file.flush()
            try:
                result=request('/v1/run',{'provider':payload['provider'],'endpoint':payload['endpoint'],'input':payload.get('input',{})})
                entry.update({k:result[k] for k in ['runId','status','billing','providerResponse'] if k in result})
            except Exception:
                entry['status']='REQUEST_FAILED';file.seek(0);file.truncate();json.dump(ledger,file);raise
            file.seek(0);file.truncate();json.dump(ledger,file)
            return result
    if action=='result':
        run_id=str(payload['runId'])
        if not all(c.isalnum() or c in '-_' for c in run_id): raise ValueError('Invalid run ID')
        result=request('/v1/runs/'+run_id)
        with (ROOT/'monid-ledger.json').open('r+') as file:
            fcntl.flock(file,fcntl.LOCK_EX);ledger=json.load(file)
            for entry in ledger['runs']:
                if entry.get('runId')==run_id: entry.update({k:result[k] for k in ['status','billing','providerResponse'] if k in result})
            file.seek(0);file.truncate();json.dump(ledger,file)
        return result
    raise ValueError('Use discover, inspect, run, or result')
if __name__=='__main__':
    try: print(json.dumps(main()))
    except Exception as error:
        print(json.dumps({'error':str(error)[:250]}));sys.exit(1)
