// Dev utility: node tests/shot.mjs "<route>" "<css selector|>" out.png [width] [height] [light|dark]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const DIST = '/home/user/socialist-ireland/dist/';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = createServer(async (q, r) => { const p = join(DIST, q.url.split('?')[0].replace(/\/$/, '/index.html')); try { r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(await readFile(p)); } catch { r.writeHead(404).end(); } }).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const b = await chromium.launch();
const [route, sel, out, w, h, scheme] = process.argv.slice(2);
const ctx = await b.newContext({ viewport: { width: +(w || 1366), height: +(h || 900) }, colorScheme: scheme || 'light' });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERR', e));
await p.goto(base + '#/' + route); await p.waitForTimeout(500);
const el = sel ? p.locator(sel).first() : null;
if (el) { await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: out }); } else await p.screenshot({ path: out, fullPage: true });
await b.close(); server.close();
