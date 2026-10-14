// Small SVG chart helpers for the Economy section: line charts, stacked bars and Sankey diagrams.
// Colours come from CSS custom properties (--c1 … --c5, --c-neutral) defined in economy.css and
// validated for colour-blind separation and contrast in light and dark modes (DECISIONS D-68).
// Every chart has a legend or direct labels, a hover/keyboard tooltip and a table view.
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
import { esc } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
/** Phones get layouts drawn for their width, not desktop charts scaled down. */
const narrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;
let uid = 0;

export const fmt = {
  bn: (v) => `€${Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)}bn`.replace('€-', '−€'),
  pct: (v, d = 1) => `${(v * 100).toFixed(d)}%`.replace('-', '−'),
  num: (v, d = 1) => v.toFixed(d).replace('-', '−'),
};

/** A simple linear scale. */
function scale([d0, d1], [r0, r1]) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * k;
}
function niceTicks(min, max, n = 5) {
  const span = max - min || 1;
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

/** Table markup: headers and rows of cells (strings, already escaped where needed). */
export function tableHTML(caption, headers, rows, { numericFrom = 1 } = {}) {
  return `<table class="data-table"><caption>${caption}</caption>
    <thead><tr>${headers.map((h, i) => `<th scope="col"${i >= numericFrom ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td class="num">${c}</td>`)).join('')}</tr>`)
      .join('')}</tbody></table>`;
}

/**
 * A figure wrapper: title, legend slot, the chart, a table toggle and the source line.
 * Returns the <figure> element; the chart is drawn into figure.querySelector('.chart').
 */
export function figure({ title, desc, source, tableHtml }) {
  const id = `fig-${++uid}`;
  const f = document.createElement('figure');
  f.className = 'chart-figure';
  f.innerHTML = `
    <figcaption id="${id}-cap"><span class="chart-title">${esc(title)}</span>${desc ? `<span class="chart-desc">${esc(desc)}</span>` : ''}</figcaption>
    <div class="chart-legend"></div>
    <div class="chart" role="img" aria-labelledby="${id}-cap"></div>
    <div class="chart-foot">
      <button type="button" class="link-button table-toggle" aria-expanded="false" aria-controls="${id}-table">Show as a table</button>
      ${source ? `<span class="chart-source">${source}</span>` : ''}
    </div>
    <div class="chart-table" id="${id}-table" hidden>${tableHtml || ''}</div>
    <div class="chart-tip" role="status" aria-live="polite" hidden></div>`;
  const btn = f.querySelector('.table-toggle');
  btn.addEventListener('click', () => {
    const t = f.querySelector('.chart-table');
    t.hidden = !t.hidden;
    btn.setAttribute('aria-expanded', String(!t.hidden));
    btn.textContent = t.hidden ? 'Show as a table' : 'Hide the table';
  });
  return f;
}

function legend(f, items) {
  f.querySelector('.chart-legend').innerHTML = items
    .map((it) => `<span class="lg-item"><i class="sw ${it.dash ? 'sw-line dash' : it.line ? 'sw-line' : ''}" style="--sw:var(${it.color})" aria-hidden="true"></i>${esc(it.label)}</span>`)
    .join('');
}

function showTip(f, html, x, y) {
  const tip = f.querySelector('.chart-tip');
  tip.innerHTML = html;
  tip.hidden = false;
  const box = f.querySelector('.chart').getBoundingClientRect();
  const fb = f.getBoundingClientRect();
  const left = Math.min(Math.max(8, x - fb.left + 12), fb.width - tip.offsetWidth - 8);
  tip.style.left = `${left}px`;
  tip.style.top = `${Math.max(0, y - fb.top - tip.offsetHeight - 10)}px`;
  void box;
}
const hideTip = (f) => (f.querySelector('.chart-tip').hidden = true);

/**
 * Line chart over years.
 * opts: {years: number[], series: [{label, values, color, dash}], yFormat, thresholds: [{value, label}],
 *        breakYear, transitionEnd, yMin, yMax, height}
 */
export function lineChart(f, opts) {
  const { years, series, yFormat = (v) => fmt.num(v), thresholds = [], breakYear = null, transitionEnd = null } = opts;
  const nar = narrow();
  const W = nar ? 380 : 640;
  const H = nar ? 250 : opts.height || 260;
  const m = { l: nar ? 46 : 56, r: 10, t: 14, b: 30 };
  const all = series.flatMap((s) => s.values).concat(thresholds.map((t) => t.value));
  let yMin = opts.yMin ?? Math.min(0, ...all);
  let yMax = opts.yMax ?? Math.max(...all);
  if (yMax === yMin) yMax = yMin + 1;
  const pad = (yMax - yMin) * 0.06;
  yMin -= opts.yMin != null ? 0 : pad;
  yMax += pad;
  const x = scale([years[0], years[years.length - 1]], [m.l, W - m.r]);
  const y = scale([yMin, yMax], [H - m.b, m.t]);
  const ticks = niceTicks(yMin, yMax, 5);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'line-chart');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', `${opts.label || 'Chart'}. Use the left and right arrow keys to move through the years.`);
  let inner = '';
  if (transitionEnd != null) inner += `<rect class="transition-band" x="${x(years[0])}" y="${m.t}" width="${x(transitionEnd) - x(years[0])}" height="${H - m.t - m.b}"/><text class="band-label" x="${x(years[0]) + 6}" y="${m.t + 12}">Transition</text>`;
  if (breakYear != null) inner += `<rect class="broken-band" x="${x(breakYear)}" y="${m.t}" width="${x(years[years.length - 1]) - x(breakYear)}" height="${H - m.t - m.b}"/>`;
  inner += ticks.map((t) => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(yFormat(t))}</text>`).join('');
  if (yMin < 0 && yMax > 0) inner += `<line class="zero" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>`;
  const xt = years.filter((yr) => yr % (nar ? 10 : 5) === 0 || yr === years[0]);
  inner += xt.map((yr) => `<text class="tick" x="${x(yr)}" y="${H - m.b + 18}" text-anchor="middle">${yr === 0 ? 'Today' : `Yr ${yr}`}</text>`).join('');
  inner += thresholds.map((t) => `<line class="threshold" x1="${m.l}" x2="${W - m.r}" y1="${y(t.value)}" y2="${y(t.value)}"/><text class="threshold-label" x="${W - m.r - 4}" y="${y(t.value) - 5}" text-anchor="end">${esc(t.label)}</text>`).join('');
  for (const s of series) {
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(years[i]).toFixed(1)},${y(v).toFixed(1)}`).join('');
    inner += `<path class="series${s.dash ? ' dash' : ''}" d="${d}" style="--c:var(${s.color})"/>`;
  }
  if (breakYear != null) inner += `<g class="break-marker" transform="translate(${x(breakYear)},${m.t})"><line y2="${H - m.t - m.b}"/><text x="4" y="12">Breaks: year ${breakYear}</text></g>`;
  inner += `<line class="cursor" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>`;
  inner += series.map((s, i) => `<circle class="dot" r="4.5" data-i="${i}" style="--c:var(${s.color})" visibility="hidden"/>`).join('');
  svg.innerHTML = inner;
  const host = f.querySelector('.chart');
  host.innerHTML = '';
  host.append(svg);
  legend(f, [
    ...series.map((s) => ({ label: s.label, color: s.color, line: true, dash: s.dash })),
    ...thresholds.map((t) => ({ label: t.label, color: '--ink-2', line: true, dash: true })),
  ]);

  let cur = null;
  const show = (i) => {
    cur = i;
    const yr = years[i];
    const cx = x(yr);
    svg.querySelector('.cursor').setAttribute('x1', cx);
    svg.querySelector('.cursor').setAttribute('x2', cx);
    svg.querySelector('.cursor').setAttribute('visibility', 'visible');
    svg.querySelectorAll('.dot').forEach((c) => {
      const s = series[+c.dataset.i];
      c.setAttribute('cx', cx);
      c.setAttribute('cy', y(s.values[i]));
      c.setAttribute('visibility', 'visible');
    });
    const r = svg.getBoundingClientRect();
    const px = r.left + (cx / W) * r.width;
    const py = r.top + (y(series[0].values[i]) / H) * r.height;
    showTip(
      f,
      `<strong>${yr === 0 ? 'Today (year 0)' : `Year ${yr}`}</strong>${breakYear != null && yr >= breakYear ? ' <em>(past the break)</em>' : ''}<br>${series
        .map((s) => `<span class="tip-row"><i class="sw sw-line" style="--sw:var(${s.color})"></i>${esc(s.label)}: <b>${esc(yFormat(s.values[i]))}</b></span>`)
        .join('<br>')}`,
      px,
      py
    );
  };
  const hide = () => {
    cur = null;
    svg.querySelector('.cursor').setAttribute('visibility', 'hidden');
    svg.querySelectorAll('.dot').forEach((c) => c.setAttribute('visibility', 'hidden'));
    hideTip(f);
  };
  svg.addEventListener('pointermove', (ev) => {
    const r = svg.getBoundingClientRect();
    const vx = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    years.forEach((yr, i) => {
      if (Math.abs(x(yr) - vx) < Math.abs(x(years[best]) - vx)) best = i;
    });
    show(best);
  });
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      const i = cur == null ? 0 : Math.min(years.length - 1, Math.max(0, cur + (ev.key === 'ArrowRight' ? 1 : -1)));
      show(i);
    } else if (ev.key === 'Escape') hide();
  });
  return svg;
}

/**
 * Horizontal stacked bars, one bar per row, segments in fixed colour order.
 * opts: {rows: [{label, segments: [{key, value}]}], keys: [{key, label, color}], format}
 * Negative segments are not drawn (callers pass magnitudes).
 */
export function stackedBars(f, opts) {
  const { rows, keys, format = fmt.bn } = opts;
  const nar = narrow();
  const W = nar ? 360 : 680;
  const rowH = nar ? 22 : 30;
  const labelH = nar ? 17 : 0; // on phones the row label sits above its bar
  const m = { l: nar ? 2 : opts.labelWidth ?? 170, r: nar ? 62 : 70, t: 6, b: 6 };
  const H = m.t + m.b + rows.length * (rowH + labelH + 12);
  const max = Math.max(...rows.map((r) => r.segments.reduce((a, s) => a + Math.max(0, s.value), 0)), 1e-9);
  const x = scale([0, max], [m.l, W - m.r]);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'bar-chart');
  let inner = '';
  rows.forEach((r, ri) => {
    const yy = m.t + ri * (rowH + labelH + 12) + labelH;
    inner += nar
      ? `<text class="row-label" x="${m.l}" y="${yy - 5}">${esc(r.label)}</text>`
      : `<text class="row-label" x="${m.l - 8}" y="${yy + rowH / 2 + 5}" text-anchor="end">${esc(r.label)}</text>`;
    let acc = 0;
    r.segments.forEach((s) => {
      const k = keys.find((kk) => kk.key === s.key);
      const v = Math.max(0, s.value);
      if (v <= 0) return;
      const x0 = x(acc);
      const x1 = x(acc + v);
      acc += v;
      inner += `<rect class="seg" tabindex="0" x="${x0 + 1}" y="${yy}" width="${Math.max(0.5, x1 - x0 - 2)}" height="${rowH}" rx="2" style="--c:var(${k.color})" data-tip="${esc(`${r.label}: ${k.label}, ${format(v)}`)}"><title>${esc(`${k.label}: ${format(v)}`)}</title></rect>`;
    });
    inner += `<text class="row-total" x="${x(acc) + 6}" y="${yy + rowH / 2 + 5}">${esc(format(acc))}</text>`;
  });
  svg.innerHTML = inner;
  const host = f.querySelector('.chart');
  host.innerHTML = '';
  host.append(svg);
  legend(f, keys.map((k) => ({ label: k.label, color: k.color })));
  const onTip = (ev) => {
    const t = ev.target.closest('.seg');
    if (!t) return hideTip(f);
    const r = t.getBoundingClientRect();
    showTip(f, esc(t.dataset.tip), r.left + r.width / 2, r.top);
  };
  svg.addEventListener('pointerover', onTip);
  svg.addEventListener('focusin', onTip);
  svg.addEventListener('pointerleave', () => hideTip(f));
  svg.addEventListener('focusout', () => hideTip(f));
  return svg;
}

/**
 * Sankey diagram. nodes: [{id, label, color}], links: [{source, target, value}] (ids), format.
 * The layout must be acyclic: money flows are drawn from payers (left) to receivers (right).
 */
export function sankeyChart(f, { nodes, links, format = fmt.bn, height = 420, margin = 150, padding = 14, headings = null }) {
  const nar = narrow();
  const W = nar ? 480 : 760;
  const H = nar ? Math.round(height * 1.15) : height;
  if (nar) margin = Math.min(margin, 104);
  const live = links.filter((l) => l.value > 1e-6);
  const used = new Set(live.flatMap((l) => [l.source, l.target]));
  const graph = sankey()
    .nodeId((d) => d.id)
    .nodeAlign(sankeyJustify)
    .nodeWidth(12)
    .nodePadding(padding)
    .extent([
      [margin, 6],
      [W - margin, H - 6],
    ])({ nodes: nodes.filter((n) => used.has(n.id)).map((n) => ({ ...n })), links: live.map((l) => ({ ...l })) });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'sankey-chart');
  const path = sankeyLinkHorizontal();
  let inner = '<g class="links">';
  for (const l of graph.links) {
    inner += `<path class="link" tabindex="0" d="${path(l)}" stroke-width="${Math.max(1, l.width)}" style="--c:var(${l.source.color})" data-tip="${esc(`${l.source.label} → ${l.target.label}: ${format(l.value)}`)}"><title>${esc(`${l.source.label} → ${l.target.label}: ${format(l.value)}`)}</title></path>`;
  }
  inner += '</g><g class="nodes">';
  for (const n of graph.nodes) {
    // first column labelled to the left, others to the right, so labels sit outside the bands
    const first = n.depth === 0;
    const lx = first ? n.x0 - 6 : n.x1 + 6;
    const anchor = first ? 'end' : 'start';
    const cy = (n.y0 + n.y1) / 2;
    inner += `<rect class="node" x="${n.x0}" y="${n.y0}" width="${n.x1 - n.x0}" height="${Math.max(1, n.y1 - n.y0)}" style="--c:var(${n.color})"/>`;
    inner += `<text class="node-label" x="${lx}" y="${cy - 1}" text-anchor="${anchor}">${esc(n.label)}</text><text class="node-value" x="${lx}" y="${cy + 12}" text-anchor="${anchor}">${esc(format(n.value))}</text>`;
  }
  inner += '</g>';
  if (headings) {
    svg.setAttribute('viewBox', `0 -22 ${W} ${H + 22}`);
    inner += `<text class="col-head" x="${margin}" y="-8" text-anchor="end">${esc(headings[0])}</text><text class="col-head" x="${W - margin}" y="-8">${esc(headings[1])}</text>`;
  }
  svg.innerHTML = inner;
  const host = f.querySelector('.chart');
  host.innerHTML = '';
  host.append(svg);
  const onTip = (ev) => {
    const t = ev.target.closest('.link');
    svg.querySelectorAll('.link').forEach((p) => p.classList.toggle('is-active', p === t));
    if (!t) return hideTip(f);
    const r = t.getBoundingClientRect();
    showTip(f, esc(t.dataset.tip), r.left + r.width / 2, r.top + r.height / 2);
  };
  svg.addEventListener('pointerover', onTip);
  svg.addEventListener('focusin', onTip);
  const off = () => {
    svg.querySelectorAll('.link').forEach((p) => p.classList.remove('is-active'));
    hideTip(f);
  };
  svg.addEventListener('pointerleave', off);
  svg.addEventListener('focusout', off);
  return graph;
}
