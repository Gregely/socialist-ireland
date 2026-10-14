import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';

import { site } from './lib/data.js';
import { SECTIONS, esc } from './lib/ui.js';
import { onVariantChange, isDefault, getVariants, optionLabel, resetVariants } from './lib/state.js';
import { linkifyFailureModes } from './lib/markdown.js';

import overview from './pages/overview.js';
import map from './pages/map.js';
import threats from './pages/threats.js';
import stress from './pages/stress.js';
import day from './pages/day.js';
import constitution from './pages/constitution.js';
import choices from './pages/choices.js';
import openQuestions from './pages/open.js';
import sources from './pages/sources.js';
import researchNote from './pages/research.js';

const ROUTES = {
  '': overview,
  map,
  threats,
  stress,
  day,
  constitution,
  choices,
  open: openQuestions,
  sources,
  research: researchNote,
};

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { section: parts[0] || '', rest: parts.slice(1), params: new URLSearchParams(query) };
}

function renderHeader() {
  const { section } = parseHash();
  const header = document.getElementById('site-header');
  header.innerHTML = `
    <div class="masthead">
      <a class="brand" href="#/">
        <span class="brand-mark" aria-hidden="true">B</span>
        <span class="brand-text">
          <span class="brand-title">${esc(site.title)}</span>
          <span class="brand-sub"><span lang="ga">${esc(site.subtitle_ga)}</span> · ${esc(site.subtitle_en)}</span>
        </span>
      </a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
    <nav id="site-nav" class="site-nav" aria-label="Sections">
      <ol>
        ${SECTIONS.map(
          (s) => `<li><a href="#/${s.route}" ${s.route === section ? 'aria-current="page"' : ''}>
            <span class="nav-num" aria-hidden="true">${s.num}</span>
            <span class="nav-label"><span class="ga" lang="ga">${esc(s.ga)}</span><span class="en">${esc(s.short || s.en)}</span></span>
          </a></li>`
        ).join('')}
      </ol>
    </nav>`;
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('#site-nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
}

function renderBanner() {
  const el = document.getElementById('variant-banner');
  if (isDefault()) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const v = getVariants();
  const labels = Object.entries(v)
    .map(([q, o]) => `${q}: ${esc(optionLabel(q, o)?.short || o)}`)
    .join(' · ');
  el.hidden = false;
  el.innerHTML = `<p><strong>You are viewing an alternative design</strong> (${labels}). The project's chosen design is the default.
    <a href="#/choices">Change</a> <button type="button" class="link-button" data-reset>Restore default</button></p>`;
  el.querySelector('[data-reset]').addEventListener('click', resetVariants);
}

function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
    <div class="footer-inner">
      <p>${esc(site.footer_note)}</p>
      <p><strong>Irish-language text is provisional</strong> and awaits review by a fluent speaker. ${esc(site.honesty_note)}</p>
      <p>All text lives in <code>design/</code>, <code>content/</code> and <code>research/</code> and can be edited without touching code.</p>
    </div>`;
}

let cleanup = null;
function route() {
  const { section, rest, params } = parseHash();
  const page = ROUTES[section] || overview;
  const main = document.getElementById('main');
  if (typeof cleanup === 'function') cleanup();
  main.innerHTML = '';
  main.className = `page page-${section || 'overview'}`;
  cleanup = page(main, { rest, params });
  linkifyFailureModes(main);
  renderHeader();
  const s = SECTIONS.find((x) => x.route === section);
  document.title = `${s ? s.en + ' · ' : ''}${site.title}`;
  if (!['node', 'path', 'a'].some((k) => params.get(k))) window.scrollTo(0, 0);
  if (document.activeElement === document.body || !main.contains(document.activeElement)) {
    main.focus({ preventScroll: true });
  }
}

window.addEventListener('hashchange', route);
onVariantChange(() => {
  renderBanner();
  route();
});
renderFooter();
renderBanner();
route();
