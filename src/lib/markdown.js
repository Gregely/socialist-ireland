import { Marked } from 'marked';
import { matchesCondition } from './state.js';
import { FM, research } from './data.js';

export const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const TIERS = {
  eternal: ['Eternal', 'Cannot be amended (Art. 108)'],
  core: ['Core', 'Two Assemblies with an election between, then a referendum (Art. 109)'],
  standard: ['Standard', 'Assembly, then referendum (Art. 110)'],
};

export function tierBadge(tier) {
  const [label, title] = TIERS[tier] || TIERS.standard;
  return `<span class="tier tier-${tier}" title="${title}">${label}</span>`;
}

/** Keep only the `:::variant Q1=A … :::` blocks that match the reader's settings. */
export function applyVariants(md) {
  return md.replace(/^:::variant ([^\n]+)\n([\s\S]*?)^:::[ \t]*$/gm, (_, cond, body) =>
    matchesCondition(cond.trim()) ? body : ''
  );
}

/** Rewrite links so research notes and institution references open inside the site. */
export function siteHref(href) {
  if (!href) return href;
  const inResearch = href.match(/(?:^|\.\.\/|\/)research\/([\w.-]+?)\.md(#.*)?$/);
  if (inResearch) return `#/research/${inResearch[1]}`;
  const bare = href.match(/^(?:\.\/)?([\w.-]+?)\.md(#.*)?$/);
  if (bare && research[bare[1]]) return `#/research/${bare[1]}`;
  if (/(?:^|\.\.\/|\/)?design\/economy-(model\.md|params\.json)$/.test(href) || /^economy-(model\.md|params\.json)$/.test(href)) return '#/economy/model';
  const design = href.match(/(?:^|\.\.\/)design\/(constitution|decisions|PHASE2-OUTLINE|DECISIONS)\.(md|json)/);
  if (design) return design[1] === 'constitution' ? '#/constitution' : '#/choices';
  return href;
}

const isExternal = (href) => /^https?:\/\//.test(href);

const marked = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth, text }) {
      let tier = '';
      let raw = text;
      const m = raw.match(/\s*\{(eternal|core|standard)\}\s*$/);
      if (m) {
        tier = m[1];
        raw = raw.slice(0, m.index);
      }
      const art = raw.match(/^Article (\d+)/);
      const id = art ? `article-${art[1]}` : slug(raw);
      const inner = this.parser.parseInline(tokens).replace(/\s*\{(eternal|core|standard)\}\s*$/, '');
      const badge = tier || art ? tierBadge(tier || 'standard') : '';
      return `<h${depth} id="${id}">${inner}${badge ? ' ' + badge : ''}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const h = siteHref(href);
      const t = title ? ` title="${title}"` : '';
      if (isExternal(h)) {
        return `<a href="${h}"${t} class="ext" target="_blank" rel="noopener noreferrer">${text}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
      }
      return `<a href="${h}"${t}>${text}</a>`;
    },
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      if (/^<p><strong>Why( \(alternative\))?\.<\/strong>/.test(body.trim())) {
        return `<aside class="note" aria-label="Annotation">${body}</aside>\n`;
      }
      return `<blockquote>${body}</blockquote>\n`;
    },
  },
});

/** [[node-id|label]] → link to that institution on the map. */
const institutionLinks = (md) =>
  md.replace(/\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g, (_, id, label) => `[${label}](#/map?node=${id})`);

export function renderMarkdown(md, { variants = true } = {}) {
  let src = variants ? applyVariants(md) : md;
  src = institutionLinks(src.replace(/<!--[\s\S]*?-->/g, ''));
  return marked.parse(src);
}

export function renderInline(md) {
  return marked.parseInline(institutionLinks(md || ''));
}

/** Turn bare "FM-07" mentions inside rendered HTML into links to the failure-mode page. */
export function linkifyFailureModes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      /FM-\d\d/.test(n.nodeValue) && !n.parentElement.closest('a, code, .fm-chip, .fm-id, select, option, button, title')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    const parts = node.nodeValue.split(/(FM-\d\d)/);
    for (const part of parts) {
      if (/^FM-\d\d$/.test(part) && FM[part]) {
        const a = document.createElement('a');
        a.href = `#/threats/${part}`;
        a.className = 'fm-ref';
        a.textContent = part;
        a.title = FM[part].name_en;
        frag.append(a);
      } else if (part) {
        frag.append(part);
      }
    }
    node.replaceWith(frag);
  }
}
