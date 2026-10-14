// Smoke + accessibility test: builds nothing; run `npm run build` first.
// Serves dist/ on a local port, visits every section, fails on console errors
// or serious axe violations. Screenshots go to test-results/.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const path = join(DIST, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;

const ROUTES = (process.env.ROUTES || [
  '', 'map', 'map?node=citizens-chamber', 'map?fm=FM-04&overlay=accountability', 'threats', 'threats/FM-02',
  'stress', 'stress/capital-flight', 'stress/capital-flight?path=s1.s2.s3', 'day', 'constitution', 'choices',
  'open', 'sources', 'research/SYNTHESIS',
  'stress/eu-challenge?path=s1.s2.s3.s4b', 'stress/term-limits?path=s1.s2.s3.s4b', 'stress/harvest-energy-shock?path=s1.s2.s3.s4a',
  'stress/security-scandal?path=s1.s2.s3.s4a', 'stress/general-strike?path=s1.s2.s3.s4a', 'stress/sabotage?path=s1.s2.s3.s4b.end',
  'day/01-nurse-cork', 'day/02-farmer-leitrim', 'day/03-delegate-tallaght', 'day/04-journalist-galway', 'day/05-carer-limerick',
].join(',')).split(',');

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
let failures = 0;
const RUNS = [
  ['desktop', { width: 1366, height: 900 }, null],
  ['mobile', { width: 390, height: 844 }, null],
  // the switchable alternatives (Q1 and Q4) must render too
  ['alt-B-C', { width: 1366, height: 900 }, { Q1: 'B', Q4: 'C' }],
  ['alt-D-D', { width: 1366, height: 900 }, { Q1: 'D', Q4: 'D' }],
];
for (const [label, viewport, variants] of RUNS) {
  const context = await browser.newContext({ viewport });
  if (variants) {
    await context.addInitScript((v) => localStorage.setItem('bunreacht.variants.v1', JSON.stringify(v)), variants);
  }
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const r of ROUTES) {
    await page.goto(`${base}#/${r}`);
    await page.waitForTimeout(250);
    const h = await page.locator('main h1, main h2').first().textContent().catch(() => '');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    const name = `${label}-${r.replace(/[^\w]+/g, '_') || 'home'}`;
    if (!variants) await page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
    const ok = !errors.length && !serious.length && h;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} #/${r} — ${(h || '(no heading)').trim().slice(0, 50)}`);
    for (const e of errors) console.log('     console:', e);
    for (const v of serious) console.log(`     axe ${v.impact}: ${v.id} (${v.nodes.length}) ${v.help} :: ${v.nodes[0]?.target}`);
    errors.length = 0;
  }
  await context.close();
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
