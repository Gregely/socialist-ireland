import { vignettes } from '../lib/data.js';
import { frontmatter } from '../lib/frontmatter.js';
import { renderMarkdown } from '../lib/markdown.js';
import { esc, bi, fmChip } from '../lib/ui.js';

const all = () =>
  Object.entries(vignettes)
    .map(([id, md]) => ({ id, ...frontmatter(md) }))
    .sort((a, b) => Number(a.meta.order || 99) - Number(b.meta.order || 99));

export default function day(main, { rest }) {
  const items = all();
  const cur = items.find((v) => v.id === rest[0]);
  if (!cur) {
    main.innerHTML = `
      <div class="page-head">
        ${bi('Lá sa Phoblacht', 'A day in the republic')}
        <p class="lede">Short, unglamorous days in the life of people living under this design. They show where the system touches daily life, and where it grates.</p>
      </div>
      <ol class="card-grid">
        ${items
          .map(
            (v) => `<li><a class="card vignette-card" href="#/day/${v.id}">
            <span class="ga" lang="ga">${esc(v.meta.title_ga || '')}</span>
            <span class="card-title">${esc(v.meta.title)}</span>
            <span class="card-body">${esc(v.meta.who || '')}</span>
          </a></li>`
          )
          .join('')}
      </ol>`;
    return;
  }
  const i = items.indexOf(cur);
  const fms = (cur.meta.fms || '').split(',').map((s) => s.trim()).filter(Boolean);
  main.innerHTML = `
    <p class="crumbs"><a href="#/day">A day in the republic</a> › ${esc(cur.meta.title)}</p>
    <article class="prose vignette">
      ${bi(cur.meta.title_ga, cur.meta.title)}
      <p class="byline">${esc(cur.meta.who || '')}${cur.meta.place ? ` · ${esc(cur.meta.place)}` : ''}</p>
      ${renderMarkdown(cur.body)}
      ${fms.length ? `<aside class="vignette-fms"><h2>Failure modes at work in this story</h2><p>${fms.map((f) => fmChip(f, { long: true })).join(' ')}</p></aside>` : ''}
      <p class="muted small">A fictional vignette. Linked institutions open on the map.</p>
    </article>
    <nav class="pager" aria-label="Vignettes">
      ${items[i - 1] ? `<a href="#/day/${items[i - 1].id}">← ${esc(items[i - 1].meta.title)}</a>` : '<span></span>'}
      ${items[i + 1] ? `<a href="#/day/${items[i + 1].id}">${esc(items[i + 1].meta.title)} →</a>` : ''}
    </nav>`;
}
