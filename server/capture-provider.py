import sys, json, os, signal
signal.alarm(25)
from urllib.parse import urlparse
try:
    from playwright.sync_api import sync_playwright
except ModuleNotFoundError:
    os.execv('/home/node/free-sf/capture-venv/bin/python', ['/home/node/free-sf/capture-venv/bin/python', __file__, *sys.argv[1:]])
service = sys.argv[1]
with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    pages = [page for context in browser.contexts for page in context.pages if not page.url.startswith('about:')]
    if not pages:
        print(json.dumps({'error':'No provider page is open.'}))
        sys.exit(0)
    domains = {'classpass':['classpass.com'],'hellofresh':['hellofresh.com'],'factor':['factor75.com'],'luma':['luma.com','lu.ma'],'fitness':['fitnesssf.com']}.get(service, [])
    candidates = [page for page in pages if any((urlparse(page.url).hostname or '') == host or (urlparse(page.url).hostname or '').endswith('.'+host) for host in domains)]
    if not candidates:
        print(json.dumps({'error':'No matching provider page is open.'}))
        sys.exit(0)
    page = candidates[-1]
    evidence = page.evaluate('''() => ({url:location.href,title:document.title,text:document.body.innerText.slice(0,18000),sensitiveEntry:[...document.querySelectorAll('input')].some(e=>e.value && (e.type==='password'||/cc-number|cc-csc|cardnumber|card-number|cvv|cvc/i.test([e.autocomplete,e.name,e.id].join(' ')))),fields:[...document.querySelectorAll('input,select')].filter(e=>e.value && !/password|cc-|card|cvv|cvc/i.test([e.type,e.autocomplete,e.name,e.id].join(' '))).map(e=>e.getAttribute('aria-label')||e.name||e.id||e.type)})''')
    if not evidence['sensitiveEntry']:
        os.makedirs('/home/node/free-sf/receipts',exist_ok=True)
        screenshot='/home/node/free-sf/receipts/'+service+'.png'
        try:
            page.screenshot(path=screenshot, timeout=10000)
            evidence['screenshotPath']=screenshot
        except Exception as exc:
            evidence['screenshotError']=type(exc).__name__
    print(json.dumps(evidence))
