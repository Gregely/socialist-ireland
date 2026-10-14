import { FM } from './data.js';

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Bilingual heading in the style of Irish road signage:
 * Irish in italic above, English in roman below. Irish text is provisional.
 */
export function bi(ga, en, level = 1, extra = '') {
  return `<h${level} class="bi"${extra}>${ga ? `<span class="ga" lang="ga">${esc(ga)}</span>` : ''}<span class="en">${esc(en)}</span></h${level}>`;
}

export function fmChip(id, { long = false } = {}) {
  const f = FM[id];
  if (!f) return `<span class="fm-chip">${esc(id)}</span>`;
  return `<a class="fm-chip" href="#/threats/${id}" title="${esc(f.name_en)}"><span class="fm-id">${id}</span>${long ? ` ${esc(f.name_en)}` : ''}</a>`;
}

export const SECTIONS = [
  { route: '', ga: 'Réamhrá', en: 'Overview', num: 1 },
  { route: 'map', ga: 'Léarscáil na nInstitiúidí', en: 'Institution map', short: 'Map', num: 2 },
  { route: 'threats', ga: 'Conas a Theipeann Air', en: 'How it fails', num: 3 },
  { route: 'stress', ga: 'Tástálacha Struis', en: 'Stress tests', num: 4 },
  { route: 'day', ga: 'Lá sa Phoblacht', en: 'A day in the republic', short: 'A day in…', num: 5 },
  { route: 'constitution', ga: 'An Bunreacht', en: 'Constitution', num: 6 },
  { route: 'choices', ga: 'Na Roghanna', en: 'Design choices', short: 'Choices', num: 7 },
  { route: 'open', ga: 'Ceisteanna Oscailte', en: 'Open questions', num: 8 },
  { route: 'sources', ga: 'Foinsí', en: 'Sources', num: 9 },
];

export function scoreClass(s) {
  return { '++': 's-pp', '+': 's-p', '0': 's-0', '−': 's-m', '−−': 's-mm', '?': 's-q' }[s] || 's-q';
}

export const scoreText = {
  '++': 'strongly resists',
  '+': 'resists',
  '0': 'neutral',
  '−': 'worsens',
  '−−': 'strongly worsens',
  '?': 'unclear',
};

export function announce(msg) {
  const live = document.getElementById('live');
  if (live) {
    live.textContent = '';
    setTimeout(() => (live.textContent = msg), 30);
  }
}
