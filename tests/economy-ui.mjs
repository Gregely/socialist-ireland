// Keyboard use of the Economy section: a slider moved with the arrow keys updates the results and
// the URL; a line chart's year cursor moves with the arrow keys and shows its values; the table
// view opens. Run after a build.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const DIST = new URL('../dist/', import.meta.url).pathname;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (q, r) => {
  const p = join(DIST, q.url.split('?')[0].replace(/\/$/, '/index.html'));
  try { r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(await readFile(p)); } catch { r.writeHead(404).end(); }
}).listen(0);
const browser = await browser_();
async function browser_() { return chromium.launch(); }
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/#/economy/pressure`);
await page.waitForTimeout(300);
const before = await page.locator('.pressure-results .verdict').textContent();
await page.locator('#sl-mne_exit').focus();
for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft'); // 50% → 20%
await page.waitForTimeout(200);
const after = await page.locator('.pressure-results .verdict').textContent();
const out = await page.locator('#sl-mne_exit-out').textContent();
const url = await page.evaluate(() => location.hash);
// line chart keyboard cursor
const chart = page.locator('.pressure-charts .line-chart').first();
await chart.focus();
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowRight');
const tip = await page.locator('.pressure-charts .chart-tip').first().textContent();
// table toggle
await page.locator('.pressure-charts .table-toggle').first().click();
const tableVisible = await page.locator('.pressure-charts .chart-table').first().isVisible();
const ok = before.trim() !== after.trim() && out.trim() === '20%' && url.includes('mne_exit=0.2') && /Year 1/.test(tip) && tableVisible && !errors.length;
console.log({ before: before.trim().slice(0, 40), after: after.trim().slice(0, 40), out, url, tip: tip.trim().slice(0, 60), tableVisible, errors }, ok ? 'economy UI OK' : 'economy UI FAILED');
await browser.close(); server.close(); process.exit(ok ? 0 : 1);
