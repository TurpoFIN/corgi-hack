import json, sys
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
service, target = sys.argv[1:3]
domains={'classpass':['classpass.com'],'hellofresh':['hellofresh.com'],'factor':['factor75.com'],'luma':['luma.com','lu.ma'],'fitness':['fitnesssf.com']}.get(service,[])
if service=='discovery':
    parsed=urlparse(target)
    if parsed.scheme!='https' or not parsed.hostname or parsed.hostname in ('localhost','127.0.0.1'):
        raise SystemExit('Unexpected source URL')
    domains=[parsed.hostname]
def allowed(url):
    h=urlparse(url).hostname or ''
    return any(h==d or h.endswith('.'+d) for d in domains)
if not allowed(target):
    raise SystemExit('Unexpected provider URL')
with sync_playwright() as p:
    browser=p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    pages=[page for c in browser.contexts for page in c.pages if allowed(page.url)]
    if pages:
        page=pages[-1]
    else:
        page=browser.contexts[0].new_page()
        page.goto(target,wait_until='domcontentloaded',timeout=30000)
    page.bring_to_front()
    print(json.dumps({'focused':True,'provider':service}))
