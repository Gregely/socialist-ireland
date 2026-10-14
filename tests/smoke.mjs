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
].join(',')).split(',');

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
let failures = 0;
for (const [label, viewport] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport });
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
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
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
