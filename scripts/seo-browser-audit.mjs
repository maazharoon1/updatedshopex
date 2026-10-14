// Dependency-free local audit. Node 22+ and Edge/Chrome; never submits contact requests.
// Usage: node scripts/seo-browser-audit.mjs <output-directory> [baseline-directory]
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { projects } from '../src/data/projects.ts';
import { canonicalUrl, homeSeo, videoSeo } from '../src/lib/seo.ts';
const output = resolve(process.argv[2] || join(tmpdir(), 'shopex-seo-after'));
await mkdir(output, { recursive: true });
const baseline = process.argv[3] ? JSON.parse(await readFile(join(process.argv[3], 'browser.json'), 'utf8')) : null;
const report = { conditions: 'Headless Edge, local production build, DPR 1, no throttling; not field Core Web Vitals', pages: [], checks: [], errors: [] };
const check = (name, passed) => { report.checks.push({ name, passed }); console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`); };
const pause = ms => new Promise(r => setTimeout(r, ms));
const root = resolve('dist');
const server = createServer(async (req, res) => {
  let file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + sep)) file = join(root, 'index.html');
  try {
    if (!extname(file)) { try { await readFile(join(file, 'index.html')); file = join(file, 'index.html'); } catch { file = join(root, 'index.html'); } }
    const body = await readFile(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' })[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(4181, '127.0.0.1', r));
const profile = await mkdtemp(join(tmpdir(), 'shopex-seo-browser-'));
const browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9336', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:9336/json')).json(); break; } catch { await pause(200); } }
  if (!targets) throw Error('Browser debugging endpoint unavailable');
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params.exceptionDetails.text); });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 70; i++) { if (await evaluate(expression)) return true; await pause(100); } return false; };
  const visit = async path => { await send('Page.navigate', { url: 'http://127.0.0.1:4181' + path }); await waitFor('!!document.querySelector("h1")'); await pause(350); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.auditVitals={cls:0,lcp:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.auditVitals.cls+=e.value})).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>window.auditVitals.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});` });
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const path of ['/', '/video/v01', '/video/2dv68', '/missing-page']) {
      await visit(path); await pause(1000);
      await evaluate('document.fonts.ready');
      const page = await evaluate(`({path:location.pathname,title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content,ogImage:document.querySelector('meta[property="og:image"]')?.content,jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),bodyText:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth,forms:document.forms.length,links:[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')),vitals:window.auditVitals,geometry:[...document.querySelectorAll('body *:not(script)')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [e.tagName,e.className,r.x,r.y,r.width,r.height,s.fontFamily,s.fontSize,s.color,s.backgroundColor]})})`);
      const key = `${width}-${path.replaceAll('/', '_')}`;
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(output, key + '.png'), Buffer.from(screenshot.data, 'base64'));
      page.screenshotHash = createHash('sha256').update(screenshot.data).digest('hex');
      page.width = width;
      report.pages.push(page);
      check(`${width}px ${path} no horizontal overflow`, !page.overflow);
      if (baseline) {
        const before = baseline.pages.find(p => p.width === width && p.path === page.path);
        check(`${width}px ${path} visible text unchanged`, before?.bodyText === page.bodyText);
        check(`${width}px ${path} links unchanged`, JSON.stringify(before?.links) === JSON.stringify(page.links));
        // Compare viewport boxes/styles. Offscreen lazy-image loads change document height;
        // animated marquees also have time-dependent fractional coordinates.
        const stable = values => values.filter(v => v[2] < width && v[3] < 900 && v[2] + v[4] > 0 && v[3] + v[5] > 0)
          .map(v => [v[0],v[1],v[2],v[3],Math.min(v[4],width-v[2]),Math.min(v[5],900-v[3]),...v.slice(6)])
          .map(v => v.map(x => typeof x === 'number' ? Math.round(x * 100) / 100 : x));
        check(`${width}px ${path} viewport layout and styles unchanged`, JSON.stringify(stable(before?.geometry || [])) === JSON.stringify(stable(page.geometry)));
      }
    }
    await visit('/');
    const categories = await evaluate('[...document.querySelectorAll("button[aria-pressed]")].map(b=>b.textContent.trim())');
    for (const category of categories) {
      await evaluate(`[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.trim()===${JSON.stringify(category)}).click()`);
      check(`${width}px ${category} filter works`, await waitFor(`document.querySelector('button[aria-pressed="true"]')?.textContent.trim()===${JSON.stringify(category)}`));
    }
    await evaluate(`[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.trim()==='Illustration').click()`);
    await waitFor('!!document.querySelector("#Il01")');
    await evaluate('document.querySelector("#Il01").click()');
    check(`${width}px illustration gallery opens`, await waitFor('!!document.querySelector("[role=dialog]")'));
    const first = await evaluate('document.querySelector("[role=dialog] img")?.getAttribute("src")');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }); await pause(100);
    check(`${width}px gallery next image works`, first !== await evaluate('document.querySelector("[role=dialog] img")?.getAttribute("src")'));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    check(`${width}px gallery closes`, await waitFor('!document.querySelector("[role=dialog]")'));
    await visit('/');
    if (width < 768) {
      await evaluate('document.querySelector("[aria-controls=mobile-navigation]").click()');
      check('Mobile menu opens', await waitFor('!!document.querySelector("#mobile-navigation")'));
      await evaluate(`Array.from(document.getElementById('mobile-navigation').querySelectorAll('a')).find(a=>a.hash==='#projects').click()`);
      check('Mobile menu Projects navigation closes menu', await waitFor('!document.querySelector("#mobile-navigation") && location.hash==="#projects"'));
      check('Load more expands existing cards', await evaluate(`(()=>{const before=document.querySelectorAll('.project-card').length;const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Load more'));if(!b)return false;b.click();return new Promise(r=>setTimeout(()=>r(document.querySelectorAll('.project-card').length>before),150))})()`));
    }
    await evaluate('document.querySelector(".project-card").click()');
    check(`${width}px video card navigation works`, await waitFor('location.pathname.startsWith("/video/") && !!document.querySelector("video[controls] source[src]")'));
    await evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent.trim()==='Back to projects').click()`);
    check(`${width}px video back navigation works`, await waitFor('location.pathname==="/" && !!document.querySelector("#projects")'));
    await visit('/work'); check(`${width}px legacy /work redirect preserved`, await waitFor('location.pathname==="/" && location.hash==="#projects"'));
    await visit('/video/missing'); check(`${width}px invalid video redirect preserved`, await waitFor('location.pathname==="/" && location.hash==="#projects"'));
  }
  if (baseline) {
    for (const page of [homeSeo, ...projects.filter(p => p.type === 'video' && p.videoUrl).map(p => videoSeo(p, projects))]) {
      await visit(page.canonicalPath);
      const metadata = await evaluate(`({title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,image:document.querySelector('meta[property="og:image"]')?.content,description:document.querySelector('meta[name="description"]')?.content,robots:document.querySelector('meta[name="robots"]')?.content,schema:document.querySelectorAll('#shopex-schema').length})`);
      check(`${page.canonicalPath} rendered metadata matches static metadata`, metadata.title === page.title && metadata.description === page.description && metadata.canonical === canonicalUrl(page.canonicalPath) && metadata.image === page.image && metadata.schema === 1 && !metadata.robots.includes('noindex'));
    }
    await visit('/missing-page');
    check('404 noindex removes canonical and structured data', await evaluate(`document.querySelector('meta[name="robots"]').content.includes('noindex')&&!document.querySelector('link[rel="canonical"]')&&!document.querySelector('#shopex-schema')`));
    await evaluate('document.querySelector("a").click()');
    check('Returning home restores indexability, canonical and schema', await waitFor(`document.title===${JSON.stringify(homeSeo.title)} && !!document.querySelector('link[rel="canonical"]') && !!document.querySelector('#shopex-schema') && !document.querySelector('meta[name="robots"]').content.includes('noindex')`));
  }
  check('No browser JavaScript exceptions', report.errors.length === 0);
} finally {
  await writeFile(join(output, 'browser.json'), JSON.stringify(report, null, 2));
  ws?.close(); browser.kill(); server.close();
  await pause(500); await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
}
console.log('Report: ' + join(output, 'browser.json'));
if (report.checks.some(c => !c.passed)) process.exitCode = 1;
