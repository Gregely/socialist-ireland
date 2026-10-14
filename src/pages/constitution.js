import { constitutionMd } from '../lib/data.js';
import { renderMarkdown } from '../lib/markdown.js';
import { bi, esc } from '../lib/ui.js';

/** Group the flat rendered HTML into parts and articles, with annotations in the margin. */
function structure(doc) {
  const out = document.createElement('div');
  out.className = 'const-body';
  let part = null;
  let art = null;
  const toc = [];
  for (const el of [...doc.children]) {
    if (el.tagName === 'H1') continue;
    if (el.tagName === 'H2') {
      part = document.createElement('section');
      part.className = 'const-part';
      part.setAttribute('aria-labelledby', el.id);
      part.append(el);
      out.append(part);
      art = null;
      toc.push({ id: el.id, title: el.textContent, arts: [] });
      continue;
    }
    if (el.tagName === 'H3' && el.id.startsWith('article-')) {
      art = document.createElement('section');
      art.className = 'const-article';
      art.id = `sec-${el.id}`;
      const text = document.createElement('div');
      text.className = 'art-text';
      const notes = document.createElement('div');
      notes.className = 'art-notes';
      text.append(el);
      art.append(text, notes);
      (part || out).append(art);
      toc[toc.length - 1]?.arts.push({ id: el.id, title: el.textContent.replace(/(Eternal|Core|Standard)$/, '').trim() });
      continue;
    }
    if (el.tagName === 'H3') {
      art = null;
      (part || out).append(el);
      continue;
    }
    if (art) {
      if (el.classList.contains('note')) art.querySelector('.art-notes').append(el);
      else art.querySelector('.art-text').append(el);
    } else (part || out).append(el);
  }
  return { body: out, toc };
}

export default function constitution(main, { params }) {
  const doc = document.createElement('div');
  doc.innerHTML = renderMarkdown(constitutionMd);
  const intro = doc.querySelector('h1 + p');
  const introHtml = intro ? intro.innerHTML : '';
  intro?.remove();
  const { body, toc } = structure(doc);

  main.innerHTML = `
    <div class="page-head">
      ${bi('An Bunreacht', 'Constitution reader')}
      <p class="lede">${introHtml}</p>
      <ul class="tier-key" aria-label="Entrenchment tiers">
        <li><span class="tier tier-eternal">Eternal</span> cannot be amended: democratic rights only</li>
        <li><span class="tier tier-core">Core</span> two Assemblies with an election between, then a referendum</li>
        <li><span class="tier tier-standard">Standard</span> Assembly, then a referendum</li>
      </ul>
    </div>
    <div class="const-tools">
      <label>Find in the text <input type="search" name="q" placeholder="e.g. recall, emergency, care"></label>
      <label class="check"><input type="checkbox" name="notes" checked> Show annotations</label>
      <span class="const-count muted" aria-live="polite"></span>
    </div>
    <div class="const-layout">
      <nav class="const-toc" aria-label="Contents">
        <details open><summary>Contents</summary>
        <ol>${toc
          .map(
            (p) => `<li><a href="#/constitution?a=${p.id}">${esc(p.title)}</a>${
              p.arts.length
                ? `<ol>${p.arts.map((a) => `<li><a href="#/constitution?a=${a.id.replace('article-', '')}">${esc(a.title)}</a></li>`).join('')}</ol>`
                : ''
            }</li>`
          )
          .join('')}</ol></details>
      </nav>
      <div class="const-main"></div>
    </div>`;
  main.querySelector('.const-main').append(body);

  const q = main.querySelector('input[name=q]');
  const count = main.querySelector('.const-count');
  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    let n = 0;
    body.querySelectorAll('.const-article').forEach((a) => {
      const hit = !term || a.textContent.toLowerCase().includes(term);
      a.hidden = !hit;
      if (hit && term) n++;
    });
    body.querySelectorAll('.const-part').forEach((p) => {
      p.hidden = term && !p.querySelector('.const-article:not([hidden])');
    });
    count.textContent = term ? `${n} article${n === 1 ? '' : 's'} match` : '';
  });
  main.querySelector('input[name=notes]').addEventListener('change', (e) => {
    body.classList.toggle('hide-notes', !e.target.checked);
  });

  const a = params.get('a');
  if (a) {
    const target = /^\d+$/.test(a) ? main.querySelector(`#sec-article-${a}`) : main.querySelector(`#${CSS.escape(a)}`);
    if (target) {
      target.classList.add('flash');
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
  // in-page TOC links shouldn't re-render the page: scroll instead
  main.querySelector('.const-toc').addEventListener('click', (ev) => {
    const link = ev.target.closest('a');
    if (!link) return;
    ev.preventDefault();
    const v = new URLSearchParams(link.getAttribute('href').split('?')[1]).get('a');
    const t = /^\d+$/.test(v) ? main.querySelector(`#sec-article-${v}`) : main.querySelector(`#${CSS.escape(v)}`);
    history.replaceState(null, '', link.getAttribute('href'));
    t?.scrollIntoView({ block: 'start' });
    t?.querySelector('h2, h3')?.setAttribute('tabindex', '-1');
    t?.querySelector('h2, h3')?.focus({ preventScroll: true });
  });
}
