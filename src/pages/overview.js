import { overviewMd, FM_LIST, institutions, scenarios } from '../lib/data.js';
import { renderMarkdown } from '../lib/markdown.js';
import { SECTIONS, esc, bi } from '../lib/ui.js';

const BLURBS = {
  map: 'Every body in the design, and who can remove, fund and inform whom.',
  threats: 'Eighteen ways socialist states have failed, and what here resists each one.',
  stress: 'Walk through seven crises step by step, including where the safeguards could still fail.',
  day: 'Five ordinary days: a nurse, a farmer, a delegate, a journalist, a carer.',
  constitution: 'The full text, annotated with its reasons and sources.',
  choices: 'The contested decisions, including two you can switch to compare alternatives.',
  open: 'Unresolved tensions and the strongest objections.',
  sources: 'Everything the design rests on, organised by topic.',
};

export default function overview(main) {
  const stats = [
    [institutions.nodes.filter((n) => !n.variants).length, 'institutions'],
    [FM_LIST.length, 'failure modes'],
    [Object.keys(scenarios).length, 'stress tests'],
  ];
  main.innerHTML = `
    <section class="hero">
      ${bi('Bunreacht don Phoblacht', 'A constitution built to survive its own supporters')}
      <p class="lede">An interactive design for a democratic socialist Ireland. Every institution is built against a known way that twentieth-century socialist states failed, and every institution states how it could still fail.</p>
      <ul class="stat-row" aria-label="At a glance">
        ${stats.map(([n, l]) => `<li><span class="stat-n">${n}</span> <span class="stat-l">${l}</span></li>`).join('')}
      </ul>
    </section>
    <nav class="card-grid section-cards" aria-label="Explore">
      ${SECTIONS.filter((s) => s.route)
        .map(
          (s) => `<a class="card section-card" href="#/${s.route}">
            <span class="route-num" aria-hidden="true">${s.num}</span>
            <span class="ga" lang="ga">${esc(s.ga)}</span>
            <span class="card-title">${esc(s.en)}</span>
            <span class="card-body">${esc(BLURBS[s.route] || '')}</span>
          </a>`
        )
        .join('')}
    </nav>
    <article class="prose">${renderMarkdown(overviewMd)}</article>`;
}
