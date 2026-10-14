// Keyboard-only use of the institution map: Tab to a body, Enter opens details, close returns focus.
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
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/#/map`);
await page.locator('.map-svg').focus();
await page.keyboard.press('Tab'); // first node
const first = await page.evaluate(() => document.activeElement.dataset.id);
await page.keyboard.press('Enter');
const panelOpen = await page.locator('.map-panel').isVisible();
const panelTitle = await page.locator('.map-panel h2').textContent();
await page.locator('.panel-close').click();
const back = await page.evaluate(() => document.activeElement.dataset.id);
const ok = first && panelOpen && back === first;
console.log({ first, panelOpen, panelTitle: panelTitle?.trim(), focusReturnedTo: back }, ok ? 'keyboard OK' : 'keyboard FAILED');
await browser.close(); server.close(); process.exit(ok ? 0 : 1);
