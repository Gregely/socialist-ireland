import { scenarios, NODES } from '../lib/data.js';
import { matchesCondition, optionLabel } from '../lib/state.js';
import { renderMarkdown } from '../lib/markdown.js';
import { esc, bi, fmChip, announce } from '../lib/ui.js';

const ORDER = ['capital-flight', 'eu-challenge', 'term-limits', 'harvest-energy-shock', 'security-scandal', 'general-strike', 'sabotage'];
const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
const sorted = () => Object.entries(scenarios).sort(([a], [b]) => rank(a) - rank(b));

function list(main) {
  main.innerHTML = `
    <div class="page-head">
      ${bi('Tástálacha Struis', 'Stress tests')}
      <p class="lede">Seven crises, walked through step by step. At each step you can see which institutions act, which safeguards are triggered, and where it could still go wrong. Where there is a real choice, the path branches. This is not a game: there is no winning, only consequences.</p>
    </div>
    <ol class="card-grid">
      ${sorted()
        .map(
          ([id, s]) => `<li><a class="card" href="#/stress/${id}">
          <span class="ga" lang="ga">${esc(s.title_ga)}</span>
          <span class="card-title">${esc(s.title_en)}</span>
          <span class="card-body">${esc(s.summary)}</span>
          <span class="fm-mini">${(s.fms || []).map((f) => `<span class="fm-chip"><span class="fm-id">${f}</span></span>`).join('')}</span>
        </a></li>`
        )
        .join('')}
    </ol>`;
}

function scenario(main, id, params) {
  const sc = scenarios[id];
  const path = (params.get('path') || sc.start).split('.').filter((s) => sc.steps[s]);
  if (!path.length) path.push(sc.start);
  const stepId = path[path.length - 1];
  const step = sc.steps[stepId];
  const notes = Object.entries(step.alt_notes || {}).filter(([cond]) => matchesCondition(cond));
  const href = (p) => `#/stress/${id}?path=${p.join('.')}`;

  main.innerHTML = `
    <p class="crumbs"><a href="#/stress">Stress tests</a> › ${esc(sc.title_en)}</p>
    <div class="page-head">
      ${bi(sc.title_ga, sc.title_en)}
      <p class="lede">${esc(sc.summary)}</p>
    </div>
    <ol class="trail" aria-label="Your path through this scenario">
      ${path
        .map((s, i) =>
          i === path.length - 1
            ? `<li aria-current="step"><span>${i + 1}. ${esc(sc.steps[s].title)}</span></li>`
            : `<li><a href="${href(path.slice(0, i + 1))}">${i + 1}. ${esc(sc.steps[s].title)}</a></li>`
        )
        .join('')}
    </ol>
    <article class="step-card" tabindex="-1">
      <p class="eyebrow">Step ${path.length}${step.when ? ` · ${esc(step.when)}` : ''}</p>
      <h2>${esc(step.title)}</h2>
      <div class="prose">${renderMarkdown(step.text_md)}</div>
      ${
        step.institutions?.length
          ? `<div class="acting"><h3>Institutions acting</h3>
          <ul class="chip-list">${step.institutions
            .filter((n) => NODES[n])
            .map((n) => `<li><a class="inst-chip grp-${NODES[n].group}" href="#/map?node=${n}">${esc(NODES[n].name_en)}</a></li>`)
            .join('')}</ul>
          <a class="small" href="#/map?highlight=${step.institutions.join(',')}">See them together on the map</a></div>`
          : ''
      }
      ${step.safeguards?.length ? `<div class="triggered"><h3>Safeguards triggered</h3><p>${step.safeguards.map((f) => fmChip(f, { long: true })).join(' ')}</p></div>` : ''}
      ${step.risk_md ? `<div class="risk"><h3>Where it could still go wrong</h3>${renderMarkdown(step.risk_md)}</div>` : ''}
      ${notes
        .map(([cond, text]) => {
          const [q, o] = cond.split('=');
          return `<div class="alt-note"><h3>Under your alternative setting (${esc(q)}: ${esc(optionLabel(q, o.split(',')[0])?.short || o)})</h3>${renderMarkdown(text)}</div>`;
        })
        .join('')}
      ${step.outcome_md ? `<div class="outcome"><h3>Where this path ends</h3>${renderMarkdown(step.outcome_md)}</div>` : ''}
      <div class="step-nav">
        ${
          step.choices?.length
            ? `<fieldset class="choices"><legend>${esc(step.choice_prompt || 'A real choice. What do the institutions do?')}</legend>
              ${step.choices.map((c) => `<a class="button choice" href="${href([...path, c.to])}">${esc(c.label)}${c.note ? `<span class="choice-note">${esc(c.note)}</span>` : ''}</a>`).join('')}
            </fieldset>`
            : step.next
              ? `<a class="button" href="${href([...path, step.next])}">Next: ${esc(sc.steps[step.next].title)} →</a>`
              : `<p><a class="button" href="${href([sc.start])}">Start this scenario again</a> <a href="#/stress">All stress tests</a></p>`
        }
        ${path.length > 1 ? `<a class="back" href="${href(path.slice(0, -1))}">← Back a step</a>` : ''}
      </div>
    </article>`;
  if (params.get('path')) {
    const card = main.querySelector('.step-card');
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start' });
    announce(`Step ${path.length}: ${step.title}`);
  }
}

export default function stress(main, { rest, params }) {
  if (rest[0] && scenarios[rest[0]]) scenario(main, rest[0], params);
  else list(main);
}
