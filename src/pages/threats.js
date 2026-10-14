import { FM, FM_LIST, institutions, constitutionMd, scenarios } from '../lib/data.js';
import { matches } from '../lib/state.js';
import { applyVariants, siteHref } from '../lib/markdown.js';
import { esc, bi } from '../lib/ui.js';

function articlesMentioning(id) {
  const md = applyVariants(constitutionMd);
  const out = [];
  for (const chunk of md.split(/^### /m).slice(1)) {
    const m = chunk.match(/^Article (\d+) — ([^{\n]+)/);
    if (m && chunk.includes(id)) out.push({ n: m[1], title: m[2].trim() });
  }
  return out;
}

function list(main) {
  main.innerHTML = `
    <div class="page-head">
      ${bi('Conas a Theipeann Air', 'How it fails')}
      <p class="lede">Eighteen failure modes drawn from the history of twentieth-century socialist states and experiments. Each page shows the historical cases, the root causes, the mechanisms in this design that resist it, and what risk remains.</p>
    </div>
    <ol class="card-grid fm-grid">
      ${FM_LIST.map(
        (f) => `<li><a class="card fm-card" href="#/threats/${f.id}">
          <span class="fm-id">${f.id}</span>
          <span class="ga" lang="ga">${esc(f.name_ga)}</span>
          <span class="card-title">${esc(f.name_en)}</span>
          <span class="card-body">${esc(f.short)}</span>
        </a></li>`
      ).join('')}
    </ol>`;
}

function detail(main, id) {
  const f = FM[id];
  const idx = FM_LIST.indexOf(f);
  const prev = FM_LIST[idx - 1];
  const next = FM_LIST[idx + 1];
  const guards = institutions.nodes
    .filter((n) => matches(n.variants))
    .flatMap((n) => n.safeguards.filter((s) => s.failure_modes.includes(id)).map((s) => ({ n, s })));
  const arts = articlesMentioning(id);
  const tests = Object.entries(scenarios).filter(([, sc]) => sc.fms?.includes(id));

  main.innerHTML = `
    <p class="crumbs"><a href="#/threats">How it fails</a> › ${id}</p>
    <div class="page-head">
      <p class="eyebrow fm-id">${id}</p>
      ${bi(f.name_ga, f.name_en)}
      <p class="lede">${esc(f.short)}</p>
      <p><a class="button" href="#/map?fm=${id}">Show the safeguards on the map</a></p>
    </div>
    <div class="two-col">
      <section>
        <h2>Historical cases</h2>
        <ul class="case-list">${f.cases.map((c) => `<li><a href="${siteHref(c.ref)}">${esc(c.text)}</a></li>`).join('')}</ul>
        <h2>Root causes</h2>
        <ul>${f.roots.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        <h2>What remains</h2>
        <p class="residual">${esc(f.residual)}</p>
        <p class="muted small">Full analysis: <a href="#/research/SYNTHESIS">research synthesis</a>.</p>
      </section>
      <section>
        <h2>What resists it in this design</h2>
        ${
          guards.length
            ? `<ul class="guard-list">${guards
                .map(
                  ({ n, s }) => `<li><a href="#/map?node=${n.id}&fm=${id}"><strong>${esc(n.name_en)}</strong></a>
                  <p>${esc(s.mechanism).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>
                  <p class="residual small"><strong>Residual risk:</strong> ${esc(s.residual_risk).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p></li>`
                )
                .join('')}</ul>`
            : '<p>No institution in the current design lists a safeguard against this failure mode.</p>'
        }
        ${arts.length ? `<h3>Constitutional articles</h3><ul class="art-list">${arts.map((a) => `<li><a href="#/constitution?a=${a.n}">Art. ${a.n} — ${esc(a.title)}</a></li>`).join('')}</ul>` : ''}
        ${tests.length ? `<h3>Stress tests</h3><ul>${tests.map(([k, sc]) => `<li><a href="#/stress/${k}">${esc(sc.title_en)}</a></li>`).join('')}</ul>` : ''}
      </section>
    </div>
    <nav class="pager" aria-label="Failure modes">
      ${prev ? `<a href="#/threats/${prev.id}">← ${prev.id} ${esc(prev.name_en)}</a>` : '<span></span>'}
      ${next ? `<a href="#/threats/${next.id}">${next.id} ${esc(next.name_en)} →</a>` : ''}
    </nav>`;
}

export default function threats(main, { rest }) {
  if (rest[0] && FM[rest[0]]) detail(main, rest[0]);
  else list(main);
}
