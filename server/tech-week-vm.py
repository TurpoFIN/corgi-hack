#!/usr/bin/env python3
"""Read-only official calendar. Usage: tech-week.py search_events '{"city":["sf"],"date":"2026-10-08","registration":["open"],"limit":20}'"""
import json,sys,urllib.request
name=sys.argv[1]
if name not in ['list_cities','list_filters','search_events','get_event']: raise ValueError('Read-only calendar tool required')
args=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
req=urllib.request.Request('https://www.tech-week.com/api/mcp',data=json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':name,'arguments':args}}).encode(),headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'})
with urllib.request.urlopen(req,timeout=30) as response: result=json.load(response)
if result.get('error') or result.get('result',{}).get('isError'): raise ValueError('Official calendar query failed')
print(json.dumps(result['result'].get('structuredContent',result['result'].get('content'))))
