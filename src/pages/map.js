import { institutions, NODES, FM_LIST, FM } from '../lib/data.js';
import { matches, matchesCondition } from '../lib/state.js';
import { esc, bi, fmChip, announce } from '../lib/ui.js';
import { siteHref, linkifyFailureModes } from '../lib/markdown.js';

const W = 200; // node box
const H = 70;
const VIEW = { x: 0, y: 0, w: 1820, h: 1200 };
const OVERLAYS = [
  ['structure', 'Structure', 'Who elects, delegates to, appoints and directs whom'],
  ['accountability', 'Who can remove whom', 'Recall, election, appointment, vetoes, and links the constitution bars'],
  ['money', 'Where money flows', 'Budgets, funds and credit'],
  ['information', 'Where information flows', 'Audit, oversight, publication and referral'],
  ['all', 'All links', 'Every link at once'],
];
const SVGNS = 'http://www.w3.org/2000/svg';

function wrap(text, max = 22) {
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  if (lines.length > 2) return [lines[0], lines.slice(1).join(' ').slice(0, max - 1) + '…'];
  return lines;
}

/** Point where the segment from the centre of box a toward (tx,ty) leaves the box. */
function boxExit(a, tx, ty) {
  const dx = tx - a.x;
  const dy = ty - a.y;
  if (!dx && !dy) return { x: a.x, y: a.y };
  const sx = dx ? W / 2 / Math.abs(dx) : Infinity;
  const sy = dy ? H / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: a.x + dx * s, y: a.y + dy * s };
}

export default function map(main, { params }) {
  const state = {
    overlay: OVERLAYS.some((o) => o[0] === params.get('overlay')) ? params.get('overlay') : 'structure',
    fm: FM[params.get('fm')] ? params.get('fm') : '',
    selected: NODES[params.get('node')] && matches(NODES[params.get('node')].variants) ? params.get('node') : '',
    highlight: (params.get('highlight') || '').split(',').filter((id) => NODES[id]),
    list: params.get('view') === 'list',
    view: { ...VIEW },
  };

  const nodes = institutions.nodes.filter((n) => matches(n.variants));
  const visible = new Set(nodes.map((n) => n.id));
  const edges = institutions.edges.filter((e) => matches(e.variants) && visible.has(e.from) && visible.has(e.to));

  main.innerHTML = `
    <div class="page-head">
      ${bi('Léarscáil na nInstitiúidí', 'Institution map')}
      <p class="lede">Every body in the design. Select one to see its powers, how its members are chosen and removed, and its safeguards: which failure modes it guards against, the precedent, the residual risk, and the strongest critique of it.</p>
    </div>
    <div class="map-toolbar" role="toolbar" aria-label="Map controls">
      <fieldset class="seg">
        <legend>Overlay</legend>
        ${OVERLAYS.map(
          ([id, label, title]) =>
            `<label title="${esc(title)}"><input type="radio" name="overlay" value="${id}" ${id === state.overlay ? 'checked' : ''}><span>${esc(label)}</span></label>`
        ).join('')}
      </fieldset>
      <label class="fm-select">Highlight safeguards against
        <select name="fm">
          <option value="">— choose a failure mode —</option>
          ${FM_LIST.map((f) => `<option value="${f.id}" ${f.id === state.fm ? 'selected' : ''}>${f.id} ${esc(f.name_en)}</option>`).join('')}
        </select>
      </label>
      <div class="zoom-buttons" aria-label="Zoom">
        <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
        <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
        <button type="button" data-zoom="reset">Reset</button>
      </div>
      <button type="button" class="view-toggle" aria-pressed="${state.list}">List view</button>
    </div>
    <p class="map-hint muted small">Select a body for its details. Drag to pan; use + and − (or Ctrl + scroll, or pinch) to zoom. The list view shows the same information as text.</p>
    <p class="map-status" aria-live="polite"></p>
    <div class="map-layout">
      <div class="map-wrap" ${state.list ? 'hidden' : ''}>
        <svg class="map-svg" role="group" aria-label="Diagram of institutions. Use Tab to move between institutions and Enter to open one. Arrow keys pan, plus and minus zoom; Ctrl and scroll also zooms." tabindex="0" viewBox="0 0 ${VIEW.w} ${VIEW.h}">
          <defs></defs>
          <g class="edges"></g>
          <g class="nodes"></g>
        </svg>
        <div class="map-legend"></div>
      </div>
      <div class="map-list" ${state.list ? '' : 'hidden'}></div>
      <aside class="map-panel" aria-label="Institution details" tabindex="-1"></aside>
    </div>`;

  const svg = main.querySelector('svg');
  const gEdges = svg.querySelector('.edges');
  const gNodes = svg.querySelector('.nodes');
  const panel = main.querySelector('.map-panel');
  const status = main.querySelector('.map-status');

  // arrowhead markers, one per edge kind (colour set in CSS via class)
  svg.querySelector('defs').innerHTML = Object.keys(institutions.edge_kinds)
    .map(
      (k) => `<marker id="arr-${k}" class="mk mk-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>`
    )
    .join('');

  // ---- nodes
  for (const n of nodes) {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', `node grp-${n.group}`);
    g.setAttribute('transform', `translate(${n.pos.x},${n.pos.y})`);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `${n.name_en}. ${institutions.groups[n.group]?.en || ''}. Open details.`);
    g.dataset.id = n.id;
    const lines = wrap(n.name_en);
    g.innerHTML = `
      <rect x="${-W / 2}" y="${-H / 2}" width="${W}" height="${H}" rx="5"/>
      <rect class="band" x="${-W / 2}" y="${-H / 2}" width="6" height="${H}"/>
      ${lines
        .map((l, i) => `<text class="n-en" x="${-W / 2 + 14}" y="${(lines.length === 1 ? -3 : -12) + i * 19}">${esc(l)}</text>`)
        .join('')}
      <text class="n-ga" x="${-W / 2 + 14}" y="${lines.length === 1 ? 19 : 27}" lang="ga">${esc(n.name_ga.length > 32 ? n.name_ga.slice(0, 31) + '…' : n.name_ga)}</text>`;
    gNodes.append(g);
  }

  // ---- edges
  function drawEdges() {
    const kinds = state.overlay === 'all' ? null : institutions.overlays[state.overlay];
    const shown = edges.filter((e) => !kinds || kinds.includes(e.kind));
    const pairCount = {};
    gEdges.innerHTML = '';
    for (const e of shown) {
      const a = NODES[e.from].pos;
      const b = NODES[e.to].pos;
      const key = [e.from, e.to].sort().join('|');
      const idx = (pairCount[key] = (pairCount[key] || 0) + 1) - 1;
      const dir = e.from < e.to ? 1 : -1;
      const bend = (18 + idx * 22) * dir;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const cx = mx - ((b.y - a.y) / len) * bend;
      const cy = my + ((b.x - a.x) / len) * bend;
      const p1 = boxExit(a, cx, cy);
      const p2 = boxExit(b, cx, cy);
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', `M${p1.x},${p1.y} Q${cx},${cy} ${p2.x},${p2.y}`);
      path.setAttribute('class', `edge k-${e.kind}`);
      path.setAttribute('marker-end', `url(#arr-${e.kind})`);
      path.dataset.from = e.from;
      path.dataset.to = e.to;
      const t = document.createElementNS(SVGNS, 'title');
      t.textContent = `${NODES[e.from].name_en} ${institutions.edge_kinds[e.kind]} ${NODES[e.to].name_en}${e.note ? ' — ' + e.note : ''}`;
      path.append(t);
      gEdges.append(path);
      if (e.kind === 'barred') {
        const x = document.createElementNS(SVGNS, 'text');
        const qx = 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x;
        const qy = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;
        x.setAttribute('x', qx);
        x.setAttribute('y', qy + 6);
        x.setAttribute('class', 'barred-x');
        x.dataset.from = e.from;
        x.dataset.to = e.to;
        x.setAttribute('aria-hidden', 'true');
        x.textContent = '✕';
        gEdges.append(x);
      }
    }
    drawLegend(shown);
    applyHighlight();
  }

  function drawLegend(shown) {
    const kinds = [...new Set(shown.map((e) => e.kind))];
    main.querySelector('.map-legend').innerHTML = `
      <div class="legend-groups"><strong>Bodies</strong>${Object.entries(institutions.groups)
        .map(([g, v]) => `<span class="lg grp-${g}"><i aria-hidden="true"></i>${esc(v.en)}</span>`)
        .join('')}</div>
      <div class="legend-kinds"><strong>Links shown</strong>${kinds
        .map((k) => `<span class="lk k-${k}"><svg width="28" height="10" aria-hidden="true"><line x1="0" y1="5" x2="28" y2="5"/></svg>${esc(institutions.edge_kinds[k])}</span>`)
        .join('')}</div>`;
  }

  function applyHighlight() {
    const fmIds = state.fm ? new Set(nodes.filter((n) => n.safeguards.some((s) => s.failure_modes.includes(state.fm))).map((n) => n.id)) : null;
    const hl = state.highlight.length ? new Set(state.highlight) : null;
    const sel = state.selected;
    const neighbours = new Set();
    if (sel) {
      gEdges.querySelectorAll('.edge').forEach((p) => {
        if (p.dataset.from === sel) neighbours.add(p.dataset.to);
        if (p.dataset.to === sel) neighbours.add(p.dataset.from);
      });
    }
    gNodes.querySelectorAll('.node').forEach((g) => {
      const id = g.dataset.id;
      const on = (fmIds && fmIds.has(id)) || (hl && hl.has(id));
      const dim = (fmIds || hl) && !on && id !== sel;
      g.classList.toggle('is-hl', !!on);
      g.classList.toggle('is-dim', !!dim || (sel && id !== sel && !neighbours.has(id) && !on));
      g.classList.toggle('is-sel', id === sel);
      g.setAttribute('aria-pressed', String(id === sel));
    });
    gEdges.querySelectorAll('.edge, .barred-x').forEach((p) => {
      const touch = sel && (p.dataset.from === sel || p.dataset.to === sel);
      p.classList.toggle('is-dim', !!sel && !touch);
      p.classList.toggle('is-active', !!touch);
    });
    let msg = '';
    if (fmIds) msg = `${fmIds.size} bodies carry safeguards against ${state.fm} (${FM[state.fm].name_en}). `;
    if (hl) msg += `${hl.size} bodies highlighted from the stress test. `;
    status.textContent = msg;
  }

  // ---- panel
  function connections(id) {
    const out = edges.filter((e) => e.from === id);
    const inc = edges.filter((e) => e.to === id);
    const li = (e, other) =>
      `<li><span class="lk-kind k-${e.kind}">${esc(institutions.edge_kinds[e.kind])}</span> <button type="button" class="link-button" data-open="${other}">${esc(NODES[other].name_en)}</button>${e.note ? ` <span class="muted">— ${esc(e.note)}</span>` : ''}</li>`;
    return `
      ${out.length ? `<h4>This body…</h4><ul class="conn">${out.map((e) => li(e, e.to)).join('')}</ul>` : ''}
      ${inc.length ? `<h4>Acted on by…</h4><ul class="conn">${inc.map((e) => `<li><button type="button" class="link-button" data-open="${e.from}">${esc(NODES[e.from].name_en)}</button> <span class="lk-kind k-${e.kind}">${esc(institutions.edge_kinds[e.kind])}</span> this body${e.note ? ` <span class="muted">— ${esc(e.note)}</span>` : ''}</li>`).join('')}</ul>` : ''}`;
  }

  function critique(c) {
    const rows = [
      ['Liberal', c.liberal],
      ['Market', c.market],
      ['Left', c.left],
    ].filter(([, t]) => t && t !== '—');
    return rows.length
      ? `<dl class="critique">${rows.map(([k, t]) => `<dt>${k}</dt><dd>${esc(t)}</dd>`).join('')}</dl>`
      : '';
  }

  function renderPanel() {
    const n = NODES[state.selected];
    panel.hidden = !n;
    if (!n) {
      panel.innerHTML = '';
      return;
    }
    const summary =
      Object.entries(n.summary_variants || {}).find(([cond]) => matchesCondition(cond))?.[1] || n.summary;
    const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
    panel.innerHTML = `
      <div class="panel-head">
        <button type="button" class="panel-close" aria-label="Close details">✕</button>
        <p class="eyebrow grp-text-${n.group}">${esc(institutions.groups[n.group]?.en || '')}</p>
        ${bi(n.name_ga, n.name_en, 2)}
        ${n.articles?.length ? `<p class="arts">Constitution: ${n.articles.map((a) => `<a href="#/constitution?a=${a}">Art. ${a}</a>`).join(', ')}</p>` : ''}
      </div>
      <p>${md(summary)}</p>
      <dl class="facts">
        ${[
          ['Composition', n.composition],
          ['Chosen by', n.selection],
          ['Term', n.term],
          ['Recall / removal', n.recall],
          ['Pay', n.pay],
        ]
          .filter(([, v]) => v && v !== '—')
          .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
          .join('')}
      </dl>
      ${n.powers?.length ? `<h3>Powers</h3><ul>${n.powers.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${
        n.safeguards?.length
          ? `<h3>Safeguards</h3>${n.safeguards
              .map(
                (s) => `<section class="safeguard">
            <p class="fm-row">Guards against ${s.failure_modes.map((f) => fmChip(f, { long: true })).join(' ')}</p>
            <p><strong>Mechanism.</strong> ${md(s.mechanism)}</p>
            ${s.precedent?.length ? `<p class="prec"><strong>Precedent.</strong> ${s.precedent.map((p) => `<a href="${siteHref(p.source)}">${esc(p.text)}</a>`).join('; ')}</p>` : ''}
            <p class="residual"><strong>Residual risk.</strong> ${md(s.residual_risk)}</p>
            ${critique(s.strongest_critique) ? `<p class="crit-head"><strong>Strongest critiques</strong></p>${critique(s.strongest_critique)}` : ''}
          </section>`
              )
              .join('')}`
          : ''
      }
      <h3>Connections</h3>
      <p class="muted small">All links, whatever the overlay.</p>
      ${connections(n.id)}`;
    linkifyFailureModes(panel);
  }

  function select(id, { focusPanel = true } = {}) {
    state.selected = id;
    syncUrl();
    renderPanel();
    applyHighlight();
    if (id) {
      // keep the selected body clear of the details drawer on wide screens
      if (!window.matchMedia('(max-width: 960px)').matches && !state.list) {
        const { x } = NODES[id].pos;
        if ((x - state.view.x) / state.view.w > 0.48 || x < state.view.x) {
          state.view.x = x - state.view.w * 0.28;
          setView();
        }
      }
      announce(`${NODES[id].name_en} details opened`);
      if (focusPanel) panel.focus();
      if (window.matchMedia('(max-width: 960px)').matches) panel.scrollIntoView({ block: 'start' });
    }
  }

  function syncUrl() {
    const q = new URLSearchParams();
    if (state.overlay !== 'structure') q.set('overlay', state.overlay);
    if (state.fm) q.set('fm', state.fm);
    if (state.selected) q.set('node', state.selected);
    if (state.highlight.length) q.set('highlight', state.highlight.join(','));
    if (state.list) q.set('view', 'list');
    const s = q.toString();
    history.replaceState(null, '', `#/map${s ? '?' + s : ''}`);
  }

  // ---- list view (accessible alternative to the diagram)
  function renderList() {
    const groups = Object.entries(institutions.groups);
    main.querySelector('.map-list').innerHTML = groups
      .map(([g, label]) => {
        const items = nodes.filter((n) => n.group === g);
        if (!items.length) return '';
        return `<section><h3 class="grp-text-${g}">${esc(label.en)} <span class="ga" lang="ga">${esc(label.ga)}</span></h3><ul class="inst-list">${items
          .map(
            (n) => `<li><button type="button" class="link-button" data-open="${n.id}">${esc(n.name_en)}</button>
            <span class="muted">${esc(n.summary.split('. ')[0])}.</span>
            ${n.safeguards.length ? `<span class="fm-mini">${[...new Set(n.safeguards.flatMap((s) => s.failure_modes))].map((f) => fmChip(f)).join('')}</span>` : ''}</li>`
          )
          .join('')}</ul></section>`;
      })
      .join('');
  }

  // ---- pan & zoom
  const setView = () => svg.setAttribute('viewBox', `${state.view.x} ${state.view.y} ${state.view.w} ${state.view.h}`);
  function zoom(factor, cx = state.view.x + state.view.w / 2, cy = state.view.y + state.view.h / 2) {
    const w = Math.min(Math.max(state.view.w * factor, 420), VIEW.w * 1.6);
    const k = w / state.view.w;
    state.view = { x: cx - (cx - state.view.x) * k, y: cy - (cy - state.view.y) * k, w, h: state.view.h * k };
    setView();
  }
  const toSvg = (clientX, clientY) => {
    const r = svg.getBoundingClientRect();
    return {
      x: state.view.x + ((clientX - r.left) / r.width) * state.view.w,
      y: state.view.y + ((clientY - r.top) / r.height) * state.view.h,
    };
  };
  svg.addEventListener(
    'wheel',
    (ev) => {
      // Plain scrolling scrolls the page; Ctrl/⌘ + wheel (and trackpad pinch) zooms the map.
      if (!ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      const p = toSvg(ev.clientX, ev.clientY);
      zoom(ev.deltaY > 0 ? 1.12 : 1 / 1.12, p.x, p.y);
    },
    { passive: false }
  );
  const pointers = new Map();
  let drag = null;
  let moved = false;
  svg.addEventListener('pointerdown', (ev) => {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    drag = { x: ev.clientX, y: ev.clientY, view: { ...state.view }, dist: null };
    moved = false;
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!pointers.has(ev.pointerId) || !drag) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const r = svg.getBoundingClientRect();
    if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (drag.dist) {
        const mid = toSvg((p.x + q.x) / 2, (p.y + q.y) / 2);
        zoom(drag.dist / d, mid.x, mid.y);
      }
      drag.dist = d;
      moved = true;
      return;
    }
    const dx = ev.clientX - drag.x;
    const dy = ev.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) svg.setPointerCapture(ev.pointerId);
    moved = true;
    state.view.x = drag.view.x - (dx / r.width) * state.view.w;
    state.view.y = drag.view.y - (dy / r.height) * state.view.h;
    setView();
  });
  const endPointer = (ev) => {
    pointers.delete(ev.pointerId);
    if (!pointers.size) drag = null;
  };
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('click', (ev) => {
    if (moved) return;
    const g = ev.target.closest('.node');
    if (g) select(g.dataset.id);
  });
  svg.addEventListener('keydown', (ev) => {
    const g = ev.target.closest?.('.node');
    if (g && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      select(g.dataset.id);
      return;
    }
    const step = state.view.w * 0.08;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (ev.target === svg && moves[ev.key]) {
      ev.preventDefault();
      state.view.x += moves[ev.key][0];
      state.view.y += moves[ev.key][1];
      setView();
    } else if (ev.key === '+' || ev.key === '=') zoom(1 / 1.2);
    else if (ev.key === '-') zoom(1.2);
    else if (ev.key === '0') {
      state.view = { ...VIEW };
      setView();
    }
  });
  svg.addEventListener('focusin', (ev) => {
    // keep a keyboard-focused node inside the visible area
    const g = ev.target.closest?.('.node');
    if (!g) return;
    const { x, y } = NODES[g.dataset.id].pos;
    const v = state.view;
    if (x < v.x + W / 2 || x > v.x + v.w - W / 2 || y < v.y + H / 2 || y > v.y + v.h - H / 2) {
      state.view = { ...v, x: x - v.w / 2, y: y - v.h / 2 };
      setView();
    }
  });

  // ---- toolbar wiring
  main.querySelectorAll('input[name=overlay]').forEach((r) =>
    r.addEventListener('change', () => {
      state.overlay = r.value;
      syncUrl();
      drawEdges();
    })
  );
  main.querySelector('select[name=fm]').addEventListener('change', (ev) => {
    state.fm = ev.target.value;
    state.highlight = [];
    syncUrl();
    applyHighlight();
  });
  main.querySelectorAll('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const z = b.dataset.zoom;
      if (z === 'in') zoom(1 / 1.25);
      else if (z === 'out') zoom(1.25);
      else {
        state.view = { ...VIEW };
        setView();
      }
    })
  );
  const toggle = main.querySelector('.view-toggle');
  toggle.addEventListener('click', () => {
    state.list = !state.list;
    toggle.setAttribute('aria-pressed', String(state.list));
    main.querySelector('.map-wrap').hidden = state.list;
    main.querySelector('.map-list').hidden = !state.list;
    syncUrl();
  });
  main.addEventListener('click', (ev) => {
    const open = ev.target.closest('[data-open]');
    if (open) select(open.dataset.open);
    if (ev.target.closest('.panel-close')) {
      const prev = state.selected;
      select('', { focusPanel: false });
      gNodes.querySelector(`[data-id="${prev}"]`)?.focus();
    }
  });

  renderList();
  drawEdges();
  renderPanel();
  const narrow = window.matchMedia('(max-width: 700px)').matches;
  if (state.selected || narrow) {
    const { x, y } = state.selected ? NODES[state.selected].pos : NODES.people.pos;
    const w = narrow ? 720 : 1300;
    const h = (w * VIEW.h) / VIEW.w;
    state.view = { x: Math.max(0, x - (narrow ? w / 2 : w * 0.28)), y: Math.max(0, y - h / 3), w, h };
    setView();
  }
}
