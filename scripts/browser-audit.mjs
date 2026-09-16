// Dependency-free smoke audit against dist. Requires Node 22+ and Chromium/Edge.
// BROWSER_PATH can override the Windows Edge default. No external messages/forms are sent.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const report = { conditions: 'Local production build, headless Edge, DPR 1, no CPU/network throttling; fresh browser profile', checks: [], exceptions: [], failedRequests: [], httpErrors: [] };
const check = (name, passed, details) => { report.checks.push({name, passed, details}); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const pause = ms => new Promise(r => setTimeout(r, ms));
const server = createServer(async (req, res) => {
  try {
    let file = resolve('dist', '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(resolve('dist') + '/'.replace('/', process.platform === 'win32' ? '\\' : '/'))) file = resolve('dist/index.html');
    if (!extname(file)) file = resolve('dist/index.html');
    const body = await readFile(file);
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.ico':'image/x-icon','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'})[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(4180, '127.0.0.1', r));
const profile = await mkdtemp(join(tmpdir(), 'shopex-audit-'));
const browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9335',`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true, stdio:'ignore'});
let ws;
try {
  let targets;
  for (let i=0;i<60;i++) { try { targets=await(await fetch('http://127.0.0.1:9335/json')).json(); break; } catch { await pause(200); } }
  if (!targets) throw Error('Chromium debugging endpoint unavailable; set BROWSER_PATH.');
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0; const pending=new Map(); const requests=new Map();
  ws.addEventListener('message',e=>{
    const m=JSON.parse(e.data);
    if(m.id){ const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result); }
    if(m.method==='Runtime.exceptionThrown')report.exceptions.push(m.params.exceptionDetails);
    if(m.method==='Network.requestWillBeSent')requests.set(m.params.requestId,m.params.request.url);
    if(m.method==='Network.loadingFailed'&&!m.params.canceled)report.failedRequests.push({url:requests.get(m.params.requestId),error:m.params.errorText});
    if(m.method==='Network.responseReceived'&&m.params.response.status>=400)report.httpErrors.push({url:m.params.response.url,status:m.params.response.status});
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return true;await pause(100);}return false;};
  const visit=async path=>{await send('Page.navigate',{url:'http://127.0.0.1:4180'+path});await waitFor('!!document.querySelector("h1")');await pause(200);};
  const viewport=async(width,height=900)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(60);};
  await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.auditVitals={cls:0,lcp:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.auditVitals.cls+=e.value})).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>window.auditVitals.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});`});
  await viewport(1440);await visit('/');await pause(3500);
  report.initial=await evaluate(`({vitals:window.auditVitals,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,type:r.initiatorType,bytes:r.transferSize,duration:r.duration})),headings:[...document.querySelectorAll('h1')].map(x=>x.textContent),missingAnchors:[...document.querySelectorAll('a[href^="/#"]')].map(a=>a.hash).filter(h=>!document.querySelector(h))})`);
  check('Home anchor destinations exist',report.initial.missingAnchors.length===0,report.initial.missingAnchors);
  const categories=await evaluate('[...document.querySelectorAll("button[aria-pressed]")].map(b=>b.textContent.trim())');
  report.categories=categories;
  for(const width of [360,390,768,1024,1440,1920]){
    await viewport(width);
    await send('Emulation.setTouchEmulationEnabled',{enabled:width<640});
    for(const category of categories){
      await evaluate(`[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.trim()===${JSON.stringify(category)}).click()`);
      await waitFor('!!document.querySelector(".project-list-button,.ui-design-card")');
      const overflow=await evaluate('document.documentElement.scrollWidth>innerWidth');
      check(`${width}px / ${category} no page overflow`,!overflow);
      if(category.toLowerCase().includes('animation'))continue;
      await evaluate('document.querySelector(".project-list-button,.ui-design-card").focus();document.querySelector(".project-list-button,.ui-design-card").click()');
      await waitFor('!!document.querySelector("[role=dialog]")');
      const bounds=await evaluate(`(()=>{const d=document.querySelector('[role=dialog]');if(!d)return false;const r=d.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1})()`);
      check(`${width}px / ${category} preview fits`,bounds);
      if(width===390){
        await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:1});
        check(`${category} dialog traps keyboard focus`,await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'));
        const previous=await evaluate('document.querySelector("[role=dialog] img")?.getAttribute("src")');
        await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await pause(50);
        check(`${category} next image changes source`,await evaluate(`document.querySelector('[role=dialog] img')?.getAttribute('src')!==${JSON.stringify(previous)}`));
      }
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      await waitFor('!document.querySelector("[role=dialog]")');
    }
  }
  await viewport(390);await visit('/');
  await evaluate('document.querySelector("[aria-controls=mobile-navigation]").click()');await pause(100);
  check('Mobile menu focuses a link',await evaluate('!!document.activeElement.closest("#mobile-navigation")'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(50);
  check('Mobile menu Escape restores trigger focus',await evaluate('!document.querySelector("#mobile-navigation") && document.activeElement.getAttribute("aria-controls")==="mobile-navigation"'));
  await evaluate('document.querySelector("[aria-controls=mobile-navigation]").click()');await viewport(1024);
  check('Resizing closes mobile menu and unlocks body',await evaluate('!document.querySelector("#mobile-navigation")&&getComputedStyle(document.body).overflow!=="hidden"'));
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  for(const path of ['/about','/work','/video/v01','/video/v02','/video/v03','/video/v04','/video/v05','/video/v06','/video/v07','/video/missing','/missing-page']){
    await visit(path);
    for(const width of [360,390,768,1024,1440,1920]){
      await viewport(width);const fits=await evaluate('document.documentElement.scrollWidth<=innerWidth');check(`${path} ${width}px no overflow`,fits,fits?undefined:await evaluate('[...document.querySelectorAll("main *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth)}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width}))'));
    }
    if(path==='/about')check('About destination exists',await evaluate('!!document.querySelector("#about") || document.querySelector("h1")?.textContent.trim()==="About"'));
    if(path==='/missing-page')check('404 has its own title',await evaluate('document.title.includes("404")'));
    if(path.startsWith('/video/v'))check(`${path} native video and source`,await evaluate('!!document.querySelector("video[controls] source[src]")'));
  }
  await viewport(1440);await visit('/#UI-Design');await waitFor('!!document.querySelector(".ui-design-card")');
  await evaluate('document.querySelector(".ui-design-card").scrollIntoView({block:"center",behavior:"instant"})');
  await waitFor('document.querySelector(".ui-design-cover").naturalWidth>0');
  await evaluate('document.querySelector(".ui-design-window").style.height="100px"');await pause(100);
  const point=await evaluate('(()=>{const r=document.querySelector(".ui-design-window").getBoundingClientRect();return {x:r.x+10,y:r.y+10}})()');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await pause(4200);
  check('UI hover scroll remains accurate while card scales',await evaluate('(()=>{const w=document.querySelector(".ui-design-window"),i=w.querySelector("img");const overflow=parseFloat(getComputedStyle(i).height)-w.clientHeight;return overflow>0&&Math.abs(new DOMMatrix(getComputedStyle(i).transform).m42+overflow)<1&&new DOMMatrix(getComputedStyle(w.parentElement).transform).a>1})()'));
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  check('Reduced motion stops UI scale and scrolling',await evaluate('getComputedStyle(document.querySelector(".ui-design-card")).transform==="none"&&getComputedStyle(document.querySelector(".ui-design-cover")).transform==="none"'));
  await send('Emulation.setEmulatedMedia',{features:[]});
  await evaluate('document.querySelector(".ui-design-window").style.height=""');
  await viewport(390);await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await evaluate('document.querySelector(".ui-design-card").scrollIntoView({block:"center",behavior:"instant"})');await pause(150);
  const tap=await evaluate('(()=>{const r=document.querySelector(".ui-design-window").getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[tap]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  check('Mobile tap opens UI preview',await waitFor('!!document.querySelector("[role=dialog]")'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await visit('/');await evaluate('document.querySelector("[aria-label=\"Toggle theme\"]").click()');await pause(100);
  check('Light theme toggles',await evaluate('document.documentElement.classList.contains("light")'));
  check('Light theme has no mobile overflow',await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  check('No uncaught browser exceptions',report.exceptions.length===0);
} finally {
  await writeFile(resolve(process.argv[2] || 'browser-audit.json'),JSON.stringify(report,null,2));
  ws?.close();browser.kill();server.close();await pause(500);
  if(dirname(resolve(profile))===resolve(tmpdir())&&profile.includes('shopex-audit-'))await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});
}
if(report.checks.some(c=>!c.passed))process.exitCode=1;
