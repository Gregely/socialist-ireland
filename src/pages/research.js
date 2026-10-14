import { research } from '../lib/data.js';
import { renderMarkdown } from '../lib/markdown.js';
import { bi, esc } from '../lib/ui.js';

export default function researchNote(main, { rest }) {
  const name = rest[0];
  const md = research[name];
  if (!md) {
    main.innerHTML = `${bi('Taighde', 'Research notes')}<ul class="plain-list">${Object.keys(research)
      .sort()
      .map((k) => `<li><a href="#/research/${k}">${esc(k)}</a></li>`)
      .join('')}</ul>`;
    return;
  }
  main.innerHTML = `
    <p class="crumbs"><a href="#/sources">Sources</a> › Research notes › ${esc(name)}</p>
    <article class="prose research-note">${renderMarkdown(md, { variants: false })}</article>`;
}
