// Checks that switching Q1 really changes the constitution, map and banner, and that Q4 (no longer
// switchable, D-43) stays fixed at 'outside the EU' even if an old setting is saved.
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
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const check = [];
async function probe(v) {
  const ctx = await browser.newContext();
  if (v) await ctx.addInitScript((x) => localStorage.setItem('bunreacht.variants.v1', JSON.stringify(x)), v);
  const p = await ctx.newPage();
  await p.goto(base + '#/constitution');
  const a30 = await p.locator('#article-30').textContent();
  const a104 = await p.locator('#article-104').textContent();
  const banner = await p.locator('#variant-banner').isVisible();
  await p.goto(base + '#/map?view=list');
  const party = await p.locator('.map-list').textContent();
  await ctx.close();
  return { a30: a30.trim(), a104: a104.trim(), banner, hasLeadingParty: party.includes('The party (leading'), hasParties: party.includes('Socialist parties') };
}
const def = await probe(null);
const alt = await probe({ Q1: 'B', Q4: 'B' });
console.log('default', def);
console.log('alt    ', alt);
const ok = def.a30.includes('The party') && alt.a30.includes('Political parties') && def.a104.includes('Outside the European Union') && alt.a104 === def.a104
  && !def.banner && alt.banner && def.hasLeadingParty && !def.hasParties && alt.hasParties && !alt.hasLeadingParty;
console.log(ok ? 'variants OK' : 'variants FAILED');
await browser.close(); server.close(); process.exit(ok ? 0 : 1);
