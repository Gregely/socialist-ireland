import { decisions } from '../lib/data.js';
import { getVariants, setVariant, DEFAULTS } from '../lib/state.js';
import { renderMarkdown } from '../lib/markdown.js';
import { esc, bi, fmChip, scoreClass, scoreText, announce } from '../lib/ui.js';

function scores(opt) {
  if (!opt.scores) return '';
  return `<table class="score-table">
    <caption>How this option scores against the failure modes it affects</caption>
    <thead><tr><th scope="col">Failure mode</th><th scope="col">Score</th><th scope="col">Why</th></tr></thead>
    <tbody>${Object.entries(opt.scores)
      .map(
        ([fm, [s, why]]) => `<tr><th scope="row">${fmChip(fm, { long: true })}</th>
        <td><span class="score ${scoreClass(s)}" title="${scoreText[s] || ''}">${esc(s)}</span><span class="visually-hidden"> ${scoreText[s] || ''}</span></td>
        <td>${esc(why)}</td></tr>`
      )
      .join('')}</tbody></table>`;
}

/** Thin points, scores and costs: shared by switchable options and fixed answers. */
function details(o) {
  return `${
    o.thin_points?.length
      ? `<h4>Where the safeguards are thinnest</h4><ul class="thin">${o.thin_points.map((t) => `<li>${renderMarkdown(t).replace(/^<p>|<\/p>\s*$/g, '')}</li>`).join('')}</ul>`
      : ''
  }
      ${scores(o)}
      ${o.costs?.length ? `<h4>What it costs</h4><ul>${o.costs.map((c) => `<li>${renderMarkdown(c).replace(/^<p>|<\/p>\s*$/g, '')}</li>`).join('')}</ul>` : ''}
      ${o.gains?.length ? `<h4>What it gains</h4><ul>${o.gains.map((c) => `<li>${renderMarkdown(c).replace(/^<p>|<\/p>\s*$/g, '')}</li>`).join('')}</ul>` : ''}`;
}

/** A fixed answer (not switchable): the answer, its reasons, and an optional contrast with a rejected option. */
function fixed(q) {
  return `<p class="answer">${esc(q.answer)}</p>
    <div class="prose">${renderMarkdown(q.rationale_md)}</div>
    ${q.honesty_md ? `<div class="honesty">${renderMarkdown(q.honesty_md)}</div>` : ''}
    ${details(q)}
    ${
      q.contrast
        ? `<aside class="contrast" aria-labelledby="${q.id}-contrast">
        <p class="eyebrow">Contrast, not an option</p>
        <h3 id="${q.id}-contrast">${esc(q.contrast.title)}</h3>
        <div class="prose">${renderMarkdown(q.contrast.text_md)}</div>
      </aside>`
        : ''
    }
    ${q.links?.length ? `<p class="small">See also: ${q.links.map((l) => `<a href="${esc(l.href)}">${esc(l.text)}</a>`).join(' · ')}</p>` : ''}`;
}

function switchable(q, selected) {
  const opt = q.options.find((o) => o.id === selected) || q.options[0];
  return `
    <fieldset class="seg option-switch" data-q="${q.id}">
      <legend>Compare: switch the whole site to an alternative</legend>
      ${q.options
        .map(
          (o) => `<label><input type="radio" name="opt-${q.id}" value="${o.id}" ${o.id === opt.id ? 'checked' : ''}>
          <span>${esc(o.short)}${o.id === q.default ? ' <em>(chosen)</em>' : ''}</span></label>`
        )
        .join('')}
    </fieldset>
    <div class="option-body">
      <h3>${esc(opt.label)} ${opt.id === q.default ? '<span class="pill">The project’s choice</span>' : '<span class="pill pill-alt">Alternative</span>'}</h3>
      <p class="option-summary">${esc(opt.summary)}</p>
      <div class="prose">${renderMarkdown(opt.rationale_md)}</div>
      ${opt.honesty_md ? `<div class="honesty">${renderMarkdown(opt.honesty_md)}</div>` : ''}
      ${details(opt)}
    </div>`;
}

export default function choices(main) {
  const v = getVariants();
  main.innerHTML = `
    <div class="page-head">
      ${bi('Na Roghanna', 'Design choices')}
      <p class="lede">The contested decisions behind the design, with the reasons for each. The most contested of them, the party question, can be switched: you can move the whole site to an alternative and see what changes in the map, the constitution and the stress tests.</p>
    </div>
    <ol class="choice-list">
      ${decisions.questions
        .map(
          (q) => `<li class="choice-q" id="${q.id}">
          <p class="eyebrow">${q.id}${q.switchable ? ' · switchable' : ''}</p>
          ${bi(q.title_ga, q.title_en, 2)}
          ${
            q.switchable
              ? switchable(q, v[q.id])
              : fixed(q)
          }
        </li>`
        )
        .join('')}
    </ol>
    <p class="muted small">The full comparison of every option for every question, before these decisions were taken, is in <code>design/PHASE2-OUTLINE.md</code>. The decision log is <code>design/DECISIONS.md</code>.</p>`;

  main.querySelectorAll('.option-switch input').forEach((r) =>
    r.addEventListener('change', () => {
      const q = r.closest('[data-q]').dataset.q;
      setVariant(q, r.value);
      announce(r.value === DEFAULTS[q] ? `${q} restored to the project's choice` : `${q} switched to an alternative across the site`);
      requestAnimationFrame(() => {
        document.getElementById(q)?.scrollIntoView({ block: 'start' });
        document.querySelector(`input[name="opt-${q}"]:checked`)?.focus({ preventScroll: true });
      });
    })
  );
}
