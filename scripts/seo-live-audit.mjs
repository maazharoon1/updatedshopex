// Read-only network audit; saves raw evidence outside the repository by default.
import { projects } from '../src/data/projects.ts';
import { site, homeSeo, videoSeo } from '../src/lib/seo.ts';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const output = process.argv[2] || join(tmpdir(), 'shopex-seo-live.json');
const videos = projects.filter(p => p.type === 'video');
const pages = [homeSeo, ...videos.map(p => videoSeo(p, projects))];
const images = [...new Set(projects.flatMap(p => [p.mainImage, ...p.coverImages]).concat(['pa01', 's01', 'fl01', 'ui01']))];
const jobs = [
  ...pages.map(page => ({ kind: 'route', url: site.origin + page.canonicalPath })),
  ...['/robots.txt', '/sitemap.xml', '/work', '/missing-seo-audit-page', '/video/missing', '/video/v01/'].map(path => ({ kind: 'route-check', url: site.origin + path })),
  ...images.map(id => ({ kind: 'image', id, url: `https://res.cloudinary.com/fd9kyggd/image/upload/${encodeURIComponent(id)}` })),
  ...videos.map(p => ({ kind: 'video', id: p.id, url: p.videoUrl })),
  ...[homeSeo, ...videos.map(p => videoSeo(p, projects))].map(page => ({ kind: 'social-image', url: page.image })),
  ...['/Blackandgreenlogo.png', '/Whiteandlimelogo.png', '/favicon.ico'].map(path => ({ kind: 'local-asset', url: site.origin + path })),
];
const results = [];
let index = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (index < jobs.length) {
    const job = jobs[index++];
    try {
      const response = await fetch(job.url, { method: job.kind.startsWith('route') ? 'GET' : 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const body = job.kind.startsWith('route') ? await response.text() : '';
      results.push({ ...job, status: response.status, location: response.headers.get('location'), contentType: response.headers.get('content-type'), robots: response.headers.get('x-robots-tag'), title: body.match(/<title>(.*?)<\/title>/)?.[1], canonical: body.match(/rel="canonical" href="([^"]+)"/)?.[1], ...(job.url.endsWith('.xml') || job.url.endsWith('.txt') ? { body } : {}) });
    } catch (error) { results.push({ ...job, error: error.message }); }
  }
}));
const summary = Object.fromEntries([...new Set(results.map(r => r.kind))].map(kind => [kind, { count: results.filter(r => r.kind === kind).length, non200: results.filter(r => r.kind === kind && r.status !== 200).map(r => ({ id: r.id, url: r.url, status: r.status, error: r.error })) }]));
await writeFile(output, JSON.stringify({ date: new Date().toISOString(), note: 'Existing live deployment, before any deployment of local SEO changes', results, summary }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('Evidence: ' + output);
