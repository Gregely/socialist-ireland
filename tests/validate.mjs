// Content validator: no browser, no build. Checks that every cross-reference in the editable
// content resolves: institutions, articles, failure modes, scenario steps, vignettes, research
// notes, and variant conditions (only switchable questions and real options may be used).
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(join(root, p), 'utf8');
const json = async (p) => JSON.parse(await read(p));

const institutions = await json('design/institutions.json');
const decisions = await json('design/decisions.json');
const fms = await json('design/failure-modes.json');
const constitution = await read('design/constitution.md');
const NODES = new Set(institutions.nodes.map((n) => n.id));
const FMS = new Set(fms.failure_modes.map((f) => f.id));
const ARTICLES = new Set([...constitution.matchAll(/^### Article (\d+) /gm)].map((m) => Number(m[1])));
const SWITCH = Object.fromEntries(decisions.questions.filter((q) => q.switchable).map((q) => [q.id, new Set(q.options.map((o) => o.id))]));
const QUESTIONS = new Set(decisions.questions.map((q) => q.id));
const research = new Set((await readdir(join(root, 'research'))).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
const vignetteFiles = (await readdir(join(root, 'content/vignettes'))).filter((f) => f.endsWith('.md'));
const scenarioFiles = (await readdir(join(root, 'content/scenarios'))).filter((f) => f.endsWith('.json'));
const VIGNETTES = new Set(vignetteFiles.map((f) => f.replace(/\.md$/, '')));
const SCENARIOS = new Set(scenarioFiles.map((f) => f.replace(/\.json$/, '')));

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

/** Checks the links and references inside a piece of Markdown. */
function checkText(where, text = '') {
  if (!text) return;
  for (const m of text.matchAll(/\[\[([^|\]]+)(?:\|[^\]]*)?\]\]/g)) if (!NODES.has(m[1])) err(where, `unknown institution [[${m[1]}]]`);
  for (const m of text.matchAll(/\bFM-\d\d\b/g)) if (!FMS.has(m[0])) err(where, `unknown failure mode ${m[0]}`);
  for (const m of text.matchAll(/\(research\/([\w-]+)\.md(?:#[^)]*)?\)/g)) if (!research.has(m[1])) err(where, `missing research note ${m[1]}`);
  for (const m of text.matchAll(/#\/constitution\?a=(\d+)/g)) if (!ARTICLES.has(Number(m[1]))) err(where, `missing Article ${m[1]}`);
  for (const m of text.matchAll(/#\/map\?node=([\w-]+)/g)) if (!NODES.has(m[1])) err(where, `unknown map node ${m[1]}`);
  for (const m of text.matchAll(/#\/stress\/([\w-]+)/g)) if (!SCENARIOS.has(m[1])) err(where, `unknown stress test ${m[1]}`);
  for (const m of text.matchAll(/#\/day\/([\w-]+)/g)) if (!VIGNETTES.has(m[1])) err(where, `unknown vignette ${m[1]}`);
  // "Art. 104", "Arts. 30–33", "Article 57" → the article must exist
  for (const m of text.matchAll(/\bArt(?:icle|s?\.)\s+(\d+)(?:\s*[–-]\s*(\d+))?/g)) {
    const [a, b] = [Number(m[1]), Number(m[2] || m[1])];
    for (const n of [a, b]) if (!ARTICLES.has(n) && !/TFEU|TEU|Treaty|ECHR|Convention|Protocol|Bunreacht|1937|Agreement/.test(text.slice(m.index, m.index + 70))) err(where, `missing Article ${n} ("${m[0]}")`);
  }
  for (const m of text.matchAll(/:::variant\s+([^\n]+)/g)) checkCondition(where, m[1]);
}
function checkCondition(where, cond) {
  for (const part of cond.trim().split(/\s+/)) {
    const [q, opts] = part.split('=');
    if (!SWITCH[q]) {
      err(where, `variant condition on ${q}, which is ${QUESTIONS.has(q) ? 'not switchable' : 'not a question'}`);
      continue;
    }
    for (const o of (opts || '').split(',')) if (!SWITCH[q].has(o)) err(where, `unknown option ${q}=${o}`);
  }
}
function checkVariants(where, variants) {
  for (const [q, opts] of Object.entries(variants || {})) checkCondition(where, `${q}=${opts.join(',')}`);
}

// ---- constitution: variant blocks only
for (const m of constitution.matchAll(/:::variant\s+([^\n]+)/g)) checkCondition('constitution', m[1]);
for (const m of constitution.matchAll(/\(research\/([\w-]+)\.md/g)) if (!research.has(m[1])) err('constitution', `missing research note ${m[1]}`);

// ---- institutions
for (const n of institutions.nodes) {
  const w = `institutions:${n.id}`;
  checkVariants(w, n.variants);
  for (const cond of Object.keys(n.summary_variants || {})) checkCondition(w, cond);
  for (const a of n.articles || []) if (!ARTICLES.has(Number(a))) err(w, `missing Article ${a}`);
  for (const s of n.safeguards || []) {
    for (const f of s.failure_modes) if (!FMS.has(f)) err(w, `unknown ${f}`);
    for (const p of s.precedent || []) {
      const m = /^research\/([\w-]+)\.md/.exec(p.source || '');
      if (m && !research.has(m[1])) err(w, `missing research note ${m[1]}`);
    }
  }
  if (!institutions.groups[n.group]) err(w, `unknown group ${n.group}`);
}
for (const e of institutions.edges) {
  const w = `edge ${e.from}→${e.to}`;
  if (!NODES.has(e.from) || !NODES.has(e.to)) err(w, 'unknown endpoint');
  if (!institutions.edge_kinds[e.kind]) err(w, `unknown kind ${e.kind}`);
  checkVariants(w, e.variants);
}

// ---- scenarios
for (const f of scenarioFiles) {
  const sc = await json(`content/scenarios/${f}`);
  const id = f.replace(/\.json$/, '');
  if (!sc.steps[sc.start]) err(id, `start step ${sc.start} missing`);
  for (const fm of sc.fms || []) if (!FMS.has(fm)) err(id, `unknown ${fm}`);
  for (const [sid, st] of Object.entries(sc.steps)) {
    const w = `${id}#${sid}`;
    for (const k of ['text_md', 'risk_md', 'outcome_md', 'choice_prompt']) checkText(w, st[k]);
    for (const n of st.institutions || []) if (!NODES.has(n)) err(w, `unknown institution ${n}`);
    for (const fm of st.safeguards || []) if (!FMS.has(fm)) err(w, `unknown ${fm}`);
    for (const [cond, t] of Object.entries(st.alt_notes || {})) checkCondition(w, cond), checkText(w, t);
    if (st.next && !sc.steps[st.next]) err(w, `next step ${st.next} missing`);
    for (const c of st.choices || []) if (!sc.steps[c.to]) err(w, `choice target ${c.to} missing`);
    if (!st.next && !st.choices?.length && sid !== 'end' && !st.outcome_md) err(w, 'dead end without an outcome');
  }
  for (const c of sc.map?.counties || []) if (!/^[a-z-]+$/.test(c)) err(id, `bad county id ${c}`);
}

// ---- vignettes, pages, decisions
for (const f of vignetteFiles) checkText(`vignette ${f}`, await read(`content/vignettes/${f}`));
for (const f of ['content/overview.md', 'content/open-questions.md']) checkText(f, await read(f));
for (const q of decisions.questions) {
  checkText(`decisions ${q.id}`, [q.rationale_md, q.honesty_md, q.contrast?.text_md, ...(q.costs || []), ...(q.gains || []), ...(q.thin_points || [])].join('\n'));
  for (const o of q.options || []) checkText(`decisions ${q.id}-${o.id}`, [o.rationale_md, o.honesty_md, ...(o.thin_points || [])].join('\n'));
  for (const l of q.links || []) checkText(`decisions ${q.id} links`, `(${l.href})`.replace('(#', '#').replace(/\)$/, ''));
  if (q.switchable && !q.options.some((o) => o.id === q.default)) err(q.id, `default ${q.default} is not an option`);
}

if (errors.length) {
  console.log(errors.map((e) => `FAIL ${e}`).join('\n'));
  console.log(`${errors.length} broken reference(s)`);
  process.exit(1);
}
console.log(`validate OK: ${NODES.size} institutions, ${ARTICLES.size} articles, ${SCENARIOS.size} scenarios, ${VIGNETTES.size} vignettes, ${research.size} research notes`);
