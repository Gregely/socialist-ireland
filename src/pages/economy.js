// The Economy section: structure, flows, how the republic stays afloat, the pressure explorer and
// the model itself. All numbers come from design/economy-params.json (the model) and
// content/economy/*.json (structure and physical flows); all prose from content/economy/*.md.
import params from '../../design/economy-params.json';
import structure from '../../content/economy/structure.json';
import physical from '../../content/economy/physical.json';
import introMd from '../../content/economy/intro.md?raw';
import structureMd from '../../content/economy/structure.md?raw';
import flowsMd from '../../content/economy/flows.md?raw';
import afloatMd from '../../content/economy/afloat.md?raw';
import modelMd from '../../design/economy-model.md?raw';
import { run, firstBreaks, defaultSliders, tippingPoint, values } from '../lib/economy-model.js';
import { figure, lineChart, stackedBars, sankeyChart, tableHTML, fmt } from '../lib/charts.js';
import { renderMarkdown } from '../lib/markdown.js';
import { esc, bi, fmChip, announce } from '../lib/ui.js';
import { scenarios } from '../lib/data.js';

const VIEWS = [
  { id: '', ga: 'Forbhreathnú', en: 'Overview' },
  { id: 'structure', ga: 'Struchtúr', en: 'Structure' },
  { id: 'flows', ga: 'Sreafaí', en: 'Flows' },
  { id: 'afloat', ga: 'Ar snámh', en: 'How it stays afloat' },
  { id: 'pressure', ga: 'Brú', en: 'Pressure explorer' },
  { id: 'model', ga: 'An tsamhail', en: 'The model' },
];
const D = values(params.design);
const B = values(params.baseline);
const SL = params.sliders;
const DEFAULTS = defaultSliders(params);
// the explorer's settings are shared by every view while the page is open, and kept in the URL
let sliders = { ...DEFAULTS };

const C = ['--c1', '--c2', '--c3', '--c4', '--c5'];
const KIND_LABEL = { data: 'Data', derived: 'Derived', assumption: 'Assumption' };
const sourcesLink = '<a href="#/research/12-economy">Sources: research note 12</a>';

function readSliders(qp) {
  for (const k of Object.keys(SL)) {
    const v = parseFloat(qp.get(k));
    if (Number.isFinite(v)) sliders[k] = Math.min(SL[k].max, Math.max(SL[k].min, v));
  }
}
function sliderQuery() {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sliders)) if (v !== DEFAULTS[k]) q.set(k, String(+v.toFixed(4)));
  return q.toString();
}
const isDefault = () => Object.keys(SL).every((k) => sliders[k] === DEFAULTS[k]);
const sliderText = (k, v = sliders[k]) => (SL[k].unit === 'share' ? `${Math.round(v * 100)}%` : `${+v.toFixed(2)}`);

/** The first year in which anything breaks, or null. */
function breakSummary(result) {
  const fb = firstBreaks(result);
  const list = Object.values(fb).sort((a, b) => a.t - b.t);
  return { first: list.length ? list[0].t : null, list };
}

function viewNav(cur) {
  const q = sliderQuery();
  return `<nav class="sub-nav" aria-label="Economy views"><ul>${VIEWS.map(
    (v) => `<li><a href="#/economy${v.id ? '/' + v.id : ''}${q && v.id !== 'model' ? '?' + q : ''}" ${v.id === cur ? 'aria-current="page"' : ''}><span class="ga" lang="ga">${esc(v.ga)}</span> ${esc(v.en)}</a></li>`
  ).join('')}</ul></nav>`;
}

function settingsNote() {
  if (isDefault()) return `<p class="settings-note">Model results use the <strong>central settings</strong> of the <a href="#/economy/pressure">pressure explorer</a>.</p>`;
  const changed = Object.keys(SL).filter((k) => sliders[k] !== DEFAULTS[k]);
  return `<p class="settings-note">Model results use <strong>your settings</strong> from the <a href="#/economy/pressure?${sliderQuery()}">pressure explorer</a>: ${changed
    .map((k) => `${esc(SL[k].label.toLowerCase())} ${esc(sliderText(k))}`)
    .join('; ')}. <button type="button" class="link-button" data-reset-sliders>Back to the central settings</button></p>`;
}

const illustrative = `<p class="model-flag"><strong>An illustrative model, not a forecast.</strong> It shows how the accounts fit together and roughly where they break. Every assumption is labelled and editable in <code>design/economy-params.json</code>; see <a href="#/economy/model">the model</a>.</p>`;

// ---------------------------------------------------------------------------------------------
function overview(main) {
  const r = run(params, sliders);
  const { first, list } = breakSummary(r);
  const tip = tippingPoint(params, sliders, 'mne_exit');
  const mneLocal = B.mne_wages + B.mne_purchases + B.mne_taxes;
  const essential = B.energy_imports + B.food_imports + B.medicine_imports;
  const verdict =
    first == null
      ? `<p class="verdict ok"><strong>At these settings the republic stays afloat</strong> for all ${D.horizon} years modelled: no break in the budget, the external balance, inflation or employment.</p>`
      : `<p class="verdict broken"><strong>At these settings the republic's accounts break in year ${first}.</strong> ${list.map((b) => `${esc(b.label)} (from year ${b.t}).`).join(' ')}</p>`;
  main.querySelector('.view').innerHTML = `
    <div class="prose">${renderMarkdown(introMd)}</div>
    <div class="stat-row">
      <div class="stat"><span class="stat-num">€${B.gni_star.toFixed(0)}bn</span><span class="stat-label">GNI*, the real size of the economy, 2025</span></div>
      <div class="stat"><span class="stat-num">€${mneLocal.toFixed(0)}bn</span><span class="stat-label">Multinationals' wages, purchases and tax here a year</span></div>
      <div class="stat"><span class="stat-num">€${essential.toFixed(0)}bn</span><span class="stat-label">Energy, food and medicine imports a year</span></div>
      <div class="stat"><span class="stat-num">−2 to −3½%</span><span class="stat-label">Underlying budget balance today, without windfall tax (of GNI*)</span></div>
    </div>
    <h2>The answer, at the current settings</h2>
    ${verdict}
    ${
      tip == null
        ? `<p>With the other settings where they are, the accounts break even if <strong>no</strong> multinationals leave.</p>`
        : `<p><strong>Tipping point:</strong> with the other settings where they are, the republic gets through the ten-year transition without a break if no more than about <strong>${Math.round(tip * 100)}%</strong> of the multinationals leave. The central setting is ${Math.round(sliders.mne_exit * 100)}%.</p>`
    }
    ${illustrative}
    <ol class="card-grid econ-cards">
      ${VIEWS.slice(1)
        .map(
          (v) => `<li><a class="card" href="#/economy/${v.id}${v.id !== 'model' && sliderQuery() ? '?' + sliderQuery() : ''}"><span class="ga" lang="ga">${esc(v.ga)}</span><span class="card-title">${esc(v.en)}</span><span class="card-body">${esc(
            {
              structure: 'Who owns what, sector by sector; what is planned, marketed or free; who decides.',
              flows: 'Money between households, enterprises, the State and the world; energy, emissions and materials.',
              afloat: 'The budget, the external balance and investment, today against the transition and the long run.',
              pressure: 'Move the big uncertainties and see where the budget, the currency, prices and jobs break.',
              model: 'Every equation, identity and assumption, with its source.',
            }[v.id]
          )}</span></a></li>`
        )
        .join('')}
    </ol>`;
}

// ---------------------------------------------------------------------------------------------
function structureView(main) {
  const view = main.querySelector('.view');
  const tiers = structure.tiers;
  const exit = sliders.mne_exit;
  const mix = (s) => {
    const charter = s.charter_today * (1 - exit);
    const dom = tiers.filter((t) => t.id !== 'charter');
    const w = dom.reduce((a, t) => a + s.design[t.id], 0) || 1;
    const out = Object.fromEntries(dom.map((t) => [t.id, ((1 - charter) * s.design[t.id]) / w]));
    out.charter = charter;
    return out;
  };
  const keys = tiers.map((t, i) => ({ key: t.id, label: t.en, color: C[i] }));
  const pct = (v) => `${Math.round(v * 100)}%`;
  view.innerHTML = `
    <div class="prose">${renderMarkdown(structureMd)}</div>
    <h2>The five forms of ownership</h2>
    <dl class="tier-list">${tiers
      .map(
        (t, i) => `<div class="tier"><dt><i class="sw" style="--sw:var(${C[i]})" aria-hidden="true"></i>${esc(t.en)} <span class="ga" lang="ga">${esc(t.ga)}</span></dt>
        <dd>${esc(t.governed)}. <span class="arts">${t.articles.map((a) => `<a href="#/constitution?a=${a}">Art. ${a}</a>`).join(', ')} · <a href="#/map?node=${t.node}">on the institution map</a></span></dd></div>`
      )
      .join('')}</dl>
    <div class="fig-slot" data-fig="by-sector"></div>
    <div class="fig-slot" data-fig="totals"></div>
    ${settingsNote()}`;
  const rows = structure.sectors.map((s) => {
    const m = mix(s);
    return { label: s.en, segments: tiers.map((t) => ({ key: t.id, value: m[t.id] })), s, m };
  });
  const tbl = tableHTML(
    'Ownership by sector at the end of the transition (drafter’s targets), with each sector’s size today',
    ['Sector', 'Output today (GVA, €bn)', 'Jobs today (thousands)', 'Mode', ...tiers.map((t) => esc(t.en))],
    rows.map(({ s, m }) => [esc(s.en), s.gva.toFixed(1), s.jobs.toFixed(1), esc(structure.modes[s.mode].en), ...tiers.map((t) => pct(m[t.id]))])
  );
  const f1 = figure({
    title: 'Who would own what, by sector (year 10, the drafter’s targets)',
    desc: `Share of each sector's output by form of ownership. The foreign-charter share assumes ${Math.round(exit * 100)}% of multinationals have left.`,
    source: `${esc(structure.sources.design)}. Sector sizes: ${esc(structure.sources.gva)}; ${esc(structure.sources.jobs)}. ${sourcesLink}`,
    tableHtml: tbl,
  });
  view.querySelector('[data-fig="by-sector"]').append(f1);
  stackedBars(f1, { rows, keys, format: pct });
  // totals weighted by today's output and jobs
  const tot = (w) => {
    const sum = structure.sectors.reduce((a, s) => a + s[w], 0);
    return tiers.map((t) => ({ key: t.id, value: rows.reduce((a, r) => a + r.m[t.id] * r.s[w], 0) / sum }));
  };
  const totRows = [
    { label: 'Share of output', segments: tot('gva') },
    { label: 'Share of jobs', segments: tot('jobs') },
  ];
  const f2 = figure({
    title: 'The whole economy by form of ownership (year 10)',
    desc: 'Weighted by each sector’s output and jobs today, so this shows the mix of ownership, not a forecast of size.',
    source: `${esc(structure.sources.design)}. ${sourcesLink}`,
    tableHtml: tableHTML('Ownership shares of output and jobs', ['Measure', ...tiers.map((t) => esc(t.en))], totRows.map((r) => [r.label, ...r.segments.map((x) => pct(x.value))])),
  });
  view.querySelector('[data-fig="totals"]').append(f2);
  stackedBars(f2, { rows: totRows, keys, format: pct });
}

// ---------------------------------------------------------------------------------------------
const SECTOR_NODES = [
  { id: 'hh', label: 'Households', color: '--c1' },
  { id: 'pr', label: 'Enterprises', color: '--c2' },
  { id: 'mne', label: 'Multinationals', color: '--c3' },
  { id: 'st', label: 'The State', color: '--c4' },
  { id: 'fin', label: 'Savers and Fund', color: '--c5' },
  { id: 'row', label: 'Rest of the world', color: '--c-neutral' },
];
function moneyLinks(y) {
  const h = y.households;
  const p = y.producers;
  const s = y.state;
  const sp = s.spending;
  const x = y.external;
  const f = s.financing;
  return [
    ['hh', 'pr', y.demand.C_dom, 'Consumption of goods and services made here'],
    ['hh', 'row', y.demand.C_imp, 'Consumption of imports'],
    ['hh', 'st', h.incomeTax + h.extraTax + h.vat + h.otherTaxes, 'Taxes'],
    ['hh', 'fin', Math.max(0, h.saving), 'Saving'],
    ['pr', 'hh', p.wages + p.propertyIncome, 'Wages and property income'],
    ['pr', 'st', p.tax + p.dividend, 'Taxes and dividends'],
    ['pr', 'row', x.otherAbroad, 'Other payments abroad'],
    ['mne', 'hh', y.mne.wages, 'Wages'],
    ['mne', 'st', y.mne.taxes, 'Corporation tax'],
    ['mne', 'pr', y.mne.purchases, 'Purchases from Irish firms'],
    ['st', 'hh', s.spending.transfers + sp.farmGuarantee + sp.capReplacement + sp.jobGuarantee + h.interest, 'Transfers, Job Guarantee wages, interest'],
    ['st', 'pr', sp.services + sp.investment, 'Public services and investment'],
    ['st', 'row', x.interestAbroad + sp.euContribution, 'Interest abroad, EU contribution'],
    ['st', 'fin', s.revenue.windfall + f.repay + f.toFund, 'Windfall to the Fund, debt repaid'],
    ['row', 'pr', x.exports, 'Exports'],
    ['fin', 'st', f.fundDraw + f.fromSavers + f.fromCB, 'Borrowing and Fund drawings'],
  ];
}

function flowsView(main, params_) {
  const view = main.querySelector('.view');
  const yr = [10, 20].includes(+params_.get('year')) ? +params_.get('year') : 0;
  const r = run(params, sliders);
  const y = r.years[yr];
  const { first } = breakSummary(r);
  view.innerHTML = `
    <div class="prose">${renderMarkdown(flowsMd)}</div>
    <h2>Money, in one year</h2>
    <fieldset class="seg year-pick"><legend>Year</legend>${[0, 10, 20]
      .map((v) => `<label><input type="radio" name="year" value="${v}" ${v === yr ? 'checked' : ''}><span>${v === 0 ? 'Today' : `Year ${v}`}</span></label>`)
      .join('')}</fieldset>
    ${first != null && yr >= first ? `<p class="verdict broken">At these settings the accounts break in year ${first}. Year ${yr} is past the break, so these flows are not meaningful: in reality imports would be rationed or the currency would fall further.</p>` : ''}
    <div class="fig-slot" data-fig="money"></div>
    ${settingsNote()}
    <h2>Energy</h2>
    <fieldset class="seg energy-pick"><legend>Energy picture</legend>
      <label><input type="radio" name="energy" value="today" checked><span>2024 (real)</span></label>
      <label><input type="radio" name="energy" value="design"><span>Year 10 (illustrative)</span></label>
    </fieldset>
    <div class="fig-slot" data-fig="energy"></div>
    <h2>Emissions against the carbon budgets</h2>
    <div class="fig-slot" data-fig="emissions"></div>
    <h2>Materials</h2>
    <div class="fig-slot" data-fig="materials"></div>`;
  // money
  const links = moneyLinks(y).map(([a, b, v, what]) => ({ source: `pay-${a}`, target: `get-${b}`, value: Math.max(0, v), what }));
  const nodes = [...SECTOR_NODES.map((n) => ({ ...n, id: `pay-${n.id}` })), ...SECTOR_NODES.map((n) => ({ ...n, id: `get-${n.id}` }))];
  const name = (id) => nodes.find((n) => n.id === id).label;
  const f = figure({
    title: `Money flows, ${yr === 0 ? 'Ireland today (year 0)' : `year ${yr}`}, € billion`,
    desc: 'From the sector that pays (left) to the sector that receives (right). “Enterprises” includes public services as producers; “Savers and Fund” includes the public bank, the Social Wealth Fund and the Central Bank. Hover or tab through a band for its value.',
    source: `Model output, calibrated to the CSO national accounts for 2025. ${sourcesLink}`,
    tableHtml: tableHTML('Money flows', ['From → to', 'What', '€ billion'], links.filter((l) => l.value > 0.05).map((l) => [`${esc(name(l.source))} → ${esc(name(l.target))}`, esc(l.what), l.value.toFixed(1)]), { numericFrom: 2 }),
  });
  view.querySelector('[data-fig="money"]').append(f);
  sankeyChart(f, { nodes, links, height: 480, margin: 120, headings: ['Pays', 'Receives'] });

  const energyFig = () => {
    const mode = view.querySelector('input[name=energy]:checked').value;
    const E = physical.energy;
    const ds = E.design;
    const toE = { ...E.to_electricity };
    const elecTo = { ...E.electricity_to };
    const direct = JSON.parse(JSON.stringify(E.direct));
    if (mode === 'design') {
      toE.wind *= ds.wind.factor;
      toE.otherren *= ds.otherren.factor;
      toE.elecimp *= ds.elecimp.factor;
      toE.gas *= ds.gas_to_electricity.factor;
      toE.coalpeat *= ds.coalpeat.factor;
      direct.oil.transport *= ds.oil_transport.factor;
      direct.oil.homes *= ds.oil_homes.factor;
      for (const k of Object.keys(direct.gas)) direct.gas[k] *= ds.gas_direct.factor;
      for (const k of Object.keys(direct.coalpeat)) direct.coalpeat[k] *= ds.coalpeat.factor;
      for (const k of Object.keys(direct.otherren)) direct.otherren[k] *= ds.otherren.factor;
      elecTo.datacentres *= ds.datacentres.factor;
      elecTo.transport += ds.transport_electricity.add;
      elecTo.homes += ds.homes_electricity.add;
    }
    const supplied = Object.values(toE).reduce((a, b) => a + b, 0);
    const delivered = Object.values(elecTo).reduce((a, b) => a + b, 0);
    elecTo.losses = Math.max(0, supplied - delivered);
    const srcColor = { oil: '--c5', gas: '--c2', coalpeat: '--c-neutral', wind: '--c4', otherren: '--c1', elecimp: '--c3', waste: '--c-neutral' };
    const enodes = [
      ...Object.entries(E.sources).map(([k, v]) => ({ id: `s-${k}`, label: v.en, color: srcColor[k] })),
      { id: 'elec', label: 'Electricity', color: '--c1' },
      ...Object.entries(E.uses).map(([k, v]) => ({ id: `u-${k}`, label: v.en, color: '--c-neutral' })),
    ];
    const elinks = [
      ...Object.entries(toE).map(([k, v]) => ({ source: `s-${k}`, target: 'elec', value: v })),
      ...Object.entries(elecTo).map(([k, v]) => ({ source: 'elec', target: `u-${k}`, value: v })),
      ...Object.entries(direct).flatMap(([s, to]) => Object.entries(to).map(([u, v]) => ({ source: `s-${s}`, target: `u-${u}`, value: v }))),
    ];
    const toTWh = (k) => `${(k * 0.01163).toFixed(1)} TWh`;
    const lbl = (id) => enodes.find((n) => n.id === id).label;
    const slot = view.querySelector('[data-fig="energy"]');
    slot.innerHTML = '';
    const ef = figure({
      title: mode === 'design' ? 'Energy flows, year 10: an illustrative picture of the design' : 'Energy flows in 2024',
      desc: mode === 'design' ? 'Drafter’s assumptions, each a multiplier on the 2024 flows (see the table and content/economy/physical.json). Not a costed energy plan.' : 'From source, through electricity, to final use. Stock changes and statistical differences are left out.',
      source: `${esc(E.source)}${mode === 'design' ? '; design factors: drafter’s assumptions' : ''}. Linked: <a href="#/map?node=ecological-authority">Ecological Authority</a>, ${fmChip('FM-16')}`,
      tableHtml:
        tableHTML('Energy flows (TWh)', ['From → to', 'TWh'], elinks.filter((l) => l.value > 0.5).map((l) => [`${esc(lbl(l.source))} → ${esc(lbl(l.target))}`, (l.value * 0.01163).toFixed(1)])) +
        (mode === 'design'
          ? tableHTML('Design assumptions for year 10', ['Flow', 'Change', 'Why'], Object.entries(E.design).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [esc(k.replace(/_/g, ' ')), v.factor != null ? `× ${v.factor}` : `+ ${(v.add * 0.01163).toFixed(1)} TWh`, esc(v.why)]))
          : ''),
    });
    slot.append(ef);
    sankeyChart(ef, { nodes: enodes, links: elinks, format: toTWh, height: 460, margin: 190 });
  };
  energyFig();
  view.querySelectorAll('input[name=energy]').forEach((i) => i.addEventListener('change', energyFig));

  // emissions: today vs design year 10 (herd from the explorer)
  const Em = physical.emissions;
  const herd = sliders.herd_reduction;
  const design = Em.sectors.map((s) => ({ ...s, d: s.design.driver === 'herd' ? s.value * (1 - herd * s.design.share) : s.value * s.design.factor }));
  const groups = [
    { key: 'agri', label: 'Agriculture', ids: ['agri'] },
    { key: 'transport', label: 'Transport', ids: ['transport'] },
    { key: 'energyind', label: 'Energy and industry', ids: ['energy', 'industry'] },
    { key: 'homes', label: 'Homes', ids: ['residential'] },
    { key: 'other', label: 'Other', ids: ['other'] },
  ];
  const sumIds = (arr, ids, f2) => arr.filter((s) => ids.includes(s.id)).reduce((a, s) => a + f2(s), 0);
  const eRows = [
    { label: '2025 (real)', segments: groups.map((g) => ({ key: g.key, value: sumIds(design, g.ids, (s) => s.value) })) },
    { label: 'Year 10 (illustrative)', segments: groups.map((g) => ({ key: g.key, value: sumIds(design, g.ids, (s) => s.d) })) },
  ];
  const mt = (v) => `${v.toFixed(1)} Mt`;
  const totToday = Em.sectors.reduce((a, s) => a + s.value, 0);
  const totDesign = design.reduce((a, s) => a + s.d, 0);
  const ef = figure({
    title: 'Greenhouse gas emissions, Mt CO2eq a year',
    desc: `Year 10 assumes the herd is ${Math.round(herd * 100)}% smaller (from the explorer) and the energy changes above. Carbon budgets: ${Em.budgets.map((b) => `${b.en} ${b.value} Mt`).join('; ')}.`,
    source: `${esc(Em.source)}; design factors are the drafter’s assumptions (content/economy/physical.json). ${fmChip('FM-16')}`,
    tableHtml:
      tableHTML('Emissions by sector (Mt CO2eq)', ['Sector', '2025', 'Year 10 (illustrative)', 'Why it changes'], [
        ...design.map((s) => [esc(s.en), s.value.toFixed(1), s.d.toFixed(1), esc(s.design.why)]),
        ['<strong>Total</strong>', totToday.toFixed(1), totDesign.toFixed(1), ''],
        ...Em.budgets.map((b) => [esc(b.en), b.value.toFixed(1), b.value.toFixed(1), esc(b.source)]),
      ]),
  });
  view.querySelector('[data-fig="emissions"]').append(ef);
  stackedBars(ef, { rows: eRows, keys: groups.map((g, i) => ({ key: g.key, label: g.label, color: C[i] })), format: mt });
  const verdictE = totDesign <= Em.budgets[1].value ? 'within' : totDesign <= Em.budgets[0].value ? 'within the 2026–30 average but above the 2031–35 average' : 'above both';
  ef.querySelector('.chart-legend').insertAdjacentHTML('afterend', `<p class="small">Year 10 total ${mt(totDesign)}: ${verdictE} carbon-budget yearly averages.</p>`);

  // materials
  const Mm = physical.materials;
  const mnodes = [
    ...Object.keys(Mm.extraction).map((k, i) => ({ id: `x-${i}`, label: k, color: i < 2 ? '--c4' : i === 2 ? '--c-neutral' : '--c2' })),
    { id: 'imp', label: 'Imports', color: '--c3' },
    { id: 'dmi', label: 'Materials used and traded', color: '--c1' },
    { id: 'exp', label: 'Exports', color: '--c3' },
    ...Object.keys(Mm.consumption).map((k, i) => ({ id: `c-${i}`, label: k, color: '--c-neutral' })),
  ];
  const mlinks = [
    ...Object.entries(Mm.extraction).map(([k, v], i) => ({ source: `x-${i}`, target: 'dmi', value: v })),
    { source: 'imp', target: 'dmi', value: Mm.imports },
    { source: 'dmi', target: 'exp', value: Mm.exports },
    ...Object.entries(Mm.consumption).map(([k, v], i) => ({ source: 'dmi', target: `c-${i}`, value: v })),
  ];
  const mf = figure({
    title: 'Materials, 2024, million tonnes',
    desc: 'Domestic extraction and imports, less exports, give domestic material consumption: 22.9 tonnes a person, against an EU average of 13.3. Grazed grass and fodder for the herd are the largest single flow.',
    source: `${esc(Mm.source)}. ${sourcesLink}`,
    tableHtml: tableHTML('Material flows (Mt)', ['From → to', 'Mt'], mlinks.map((l) => [`${esc(mnodes.find((n) => n.id === l.source).label)} → ${esc(mnodes.find((n) => n.id === l.target).label)}`, l.value.toFixed(1)])),
  });
  view.querySelector('[data-fig="materials"]').append(mf);
  sankeyChart(mf, { nodes: mnodes, links: mlinks, format: (v) => `${v.toFixed(1)} Mt`, height: 470, margin: 190, padding: 24 });

  view.querySelectorAll('input[name=year]').forEach((i) =>
    i.addEventListener('change', () => {
      const q = new URLSearchParams(sliderQuery());
      q.set('year', i.value);
      location.hash = `#/economy/flows?${q}`;
    })
  );
}

// ---------------------------------------------------------------------------------------------
function timelineCharts(slot, r, { which }) {
  const years = r.years.map((y) => y.t);
  const { first } = breakSummary(r);
  const K = values(params.breaks);
  const add = (opts) => {
    const fig = figure({ title: opts.title, desc: opts.desc, source: opts.source || `Model output. ${sourcesLink}`, tableHtml: tableHTML(opts.title, ['Year', ...opts.series.map((s) => esc(s.label))], years.map((t, i) => [t === 0 ? 'Today' : `Year ${t}`, ...opts.series.map((s) => esc(opts.yFormat(s.values[i])))])) });
    slot.append(fig);
    lineChart(fig, { years, breakYear: first, transitionEnd: D.transition_years, label: opts.title, ...opts });
  };
  const ys = r.years;
  if (which.includes('budget'))
    add({
      title: 'The State’s budget balance, % of GNI*',
      desc: 'Balance: positive is a surplus. Unfinanced gap: the deficit that savers and the Central Bank ceiling cannot cover.',
      series: [
        { label: 'Budget balance', values: ys.map((y) => (100 * y.state.balance) / y.output.gniStar), color: '--c1' },
        { label: 'Unfinanced gap', values: ys.map((y) => (-100 * y.state.financing.gap) / y.output.gniStar), color: '--c5', dash: true },
      ],
      yFormat: (v) => `${fmt.num(v)}%`,
    });
  if (which.includes('debt'))
    add({
      title: 'Public debt, % of GNI*',
      series: [{ label: 'Gross public debt', values: ys.map((y) => 100 * y.indicators.debtToGni), color: '--c4' }],
      yFormat: (v) => `${Math.round(v)}%`,
    });
  if (which.includes('external'))
    add({
      title: 'Reserves: months of essential imports covered',
      desc: 'Foreign-currency reserves of the Central Bank against energy, food and medicine imports. Before exit day (year 2) this is what the Bank would hold on exit: its share of the TARGET claim, less deposits moved abroad. Negative means the reserves have run out.',
      series: [{ label: 'Months of essential imports', values: ys.map((y) => y.external.reserveMonths), color: '--c3' }],
      thresholds: [{ value: K.reserve_months, label: `Floor: ${K.reserve_months} months` }],
      yFormat: (v) => `${fmt.num(v)}`,
    });
  if (which.includes('ca'))
    add({
      title: 'Current account, % of GNI*',
      desc: 'What the domestic economy earns from abroad less what it pays out. Before exit, Ireland’s modified current account (CA*).',
      series: [{ label: 'Current account', values: ys.map((y) => 100 * y.indicators.caToGni), color: '--c2' }],
      yFormat: (v) => `${fmt.num(v)}%`,
    });
  if (which.includes('prices'))
    add({
      title: 'Inflation, % a year',
      series: [{ label: 'Consumer price inflation', values: ys.map((y) => 100 * y.prices.inflation), color: '--c5' }],
      thresholds: [{ value: 100 * K.inflation, label: `Break: ${Math.round(K.inflation * 100)}%` }],
      yFormat: (v) => `${fmt.num(v)}%`,
    });
  if (which.includes('jobs'))
    add({
      title: 'Unemployment and the Job Guarantee, % of the labour force',
      series: [
        { label: 'Unemployment', values: ys.map((y) => 100 * y.employment.unemployment), color: '--c1' },
        { label: 'In the Job Guarantee', values: ys.map((y) => (100 * y.employment.jobGuarantee) / y.employment.labourForce), color: '--c4', dash: true },
      ],
      thresholds: [{ value: 100 * K.unemployment, label: `Break: ${Math.round(K.unemployment * 100)}%` }],
      yFormat: (v) => `${fmt.num(v)}%`,
    });
  if (which.includes('wages'))
    add({
      title: 'Real wages per worker (today = 100)',
      series: [{ label: 'Real wage index', values: ys.map((y) => 100 * y.indicators.realWage), color: '--c2' }],
      yFormat: (v) => `${Math.round(v)}`,
    });
}

function afloatView(main) {
  const view = main.querySelector('.view');
  const r = run(params, sliders);
  const { first, list } = breakSummary(r);
  const pick = [0, 10, 20].map((t) => r.years[t]);
  view.innerHTML = `
    <div class="prose">${renderMarkdown(afloatMd)}</div>
    ${settingsNote()}
    ${first == null ? `<p class="verdict ok"><strong>At these settings nothing breaks</strong> in the ${D.horizon} years modelled.</p>` : `<p class="verdict broken"><strong>At these settings the accounts break in year ${first}</strong> (${list.map((b) => esc(b.label)).join('; ')}). Years after the break are shaded: the model's results there are not meaningful.</p>`}
    <h2>The budget</h2>
    <div class="fig-slot" data-fig="rev"></div>
    <div class="fig-slot" data-fig="spend"></div>
    <div class="fig-slot" data-fig="budget-line"></div>
    <h2>The external balance</h2>
    <div class="fig-slot" data-fig="ext"></div>
    <div class="fig-slot" data-fig="ext-line"></div>
    <h2>Investment: where it comes from, and who decides</h2>
    <div class="fig-slot" data-fig="inv"></div>
    <h2>The transition, year by year</h2>
    <div class="fig-slot" data-fig="timeline"></div>
    ${illustrative}`;
  const lbl = (y) => (y.t === 0 ? 'Today (2025)' : `Year ${y.t}${first != null && y.t >= first ? ' †' : ''}`);
  const pastNote = first != null ? ` † Past the break (year ${first}): not meaningful.` : '';
  const revKeys = [
    { key: 'work', label: 'Taxes on work and income', color: '--c1' },
    { key: 'spend', label: 'Taxes on spending', color: '--c2' },
    { key: 'mne', label: 'Multinationals’ corporation tax', color: '--c3' },
    { key: 'ent', label: 'Domestic enterprise tax and dividends', color: '--c4' },
    { key: 'other', label: 'Other revenue and Fund income', color: '--c5' },
  ];
  const revRows = pick.map((y) => {
    const v = y.state.revenue;
    return { label: lbl(y), segments: [
      { key: 'work', value: v.incomeTax + v.extraTax },
      { key: 'spend', value: v.vat },
      { key: 'mne', value: v.mneTaxes + v.windfall },
      { key: 'ent', value: v.surplusTax + v.dividends },
      { key: 'other', value: v.other + v.fundIncome },
    ] };
  });
  const tbl = (rows, keys, title) => tableHTML(title, ['', ...keys.map((k) => esc(k.label)), 'Total'], rows.map((r2) => [esc(r2.label), ...r2.segments.map((s) => s.value.toFixed(1)), r2.segments.reduce((a, s) => a + s.value, 0).toFixed(1)]));
  const f1 = figure({ title: 'Where the State’s money comes from, € billion a year', desc: `Nominal punts (= euro at par on exit day). Today’s figures reproduce the CSO’s general government accounts for 2025.${pastNote}`, source: `CSO GFA01 (2025) for today; model output for the republic. ${sourcesLink}`, tableHtml: tbl(revRows, revKeys, 'Revenue (€bn)') });
  view.querySelector('[data-fig="rev"]').append(f1);
  stackedBars(f1, { rows: revRows, keys: revKeys });
  const spKeys = [
    { key: 'services', label: 'Public services and the Job Guarantee', color: '--c1' },
    { key: 'transfers', label: 'Transfers, pensions, farm incomes', color: '--c2' },
    { key: 'investment', label: 'Public investment', color: '--c4' },
    { key: 'interest', label: 'Interest', color: '--c5' },
    { key: 'eu', label: 'EU contribution', color: '--c3' },
  ];
  const spRows = pick.map((y) => {
    const v = y.state.spending;
    return { label: lbl(y), segments: [
      { key: 'services', value: v.services + v.jobGuarantee },
      { key: 'transfers', value: v.transfers + v.farmGuarantee + v.capReplacement },
      { key: 'investment', value: v.investment },
      { key: 'interest', value: v.interest },
      { key: 'eu', value: v.euContribution },
    ] };
  });
  const f2 = figure({
    title: 'What the State spends, € billion a year',
    desc: pick.map((y) => `${y.t === 0 ? 'Today' : `Year ${y.t}`}: balance ${fmt.bn(y.state.balance)} (${fmt.pct(y.state.balance / y.output.gniStar)} of GNI*)${y.state.financing.gap > 0.05 ? `, unfinanced gap ${fmt.bn(y.state.financing.gap)}` : ''}`).join('. ') + `.${pastNote}`,
    source: `CSO GFA01 (2025) for today; model output for the republic. ${sourcesLink}`,
    tableHtml: tbl(spRows, spKeys, 'Spending (€bn)') + tableHTML('How the deficit is financed (€bn)', ['', 'Borrowing need', 'Fund (investment only)', 'Savers', 'Central Bank', 'Unfinanced gap'], pick.map((y) => { const f = y.state.financing; return [lbl(y), f.need.toFixed(1), f.fundDraw.toFixed(1), f.fromSavers.toFixed(1), f.fromCB.toFixed(1), f.gap.toFixed(1)]; })),
  });
  view.querySelector('[data-fig="spend"]').append(f2);
  stackedBars(f2, { rows: spRows, keys: spKeys });
  timelineCharts(view.querySelector('[data-fig="budget-line"]'), r, { which: ['budget', 'debt'] });

  const extKeys = [
    { key: 'x', label: 'Irish-owned exports', color: '--c1' },
    { key: 'mne', label: 'Multinationals’ local spending', color: '--c3' },
    { key: 'fund', label: 'Fund income', color: '--c4' },
  ];
  const outKeys = [
    { key: 'energy', label: 'Energy imports', color: '--c5' },
    { key: 'imp', label: 'Other imports', color: '--c2' },
    { key: 'int', label: 'Interest, EU, other payments abroad', color: '--c-neutral' },
  ];
  const extRows = pick.flatMap((y) => {
    const x = y.external;
    return [
      { label: `${lbl(y)}, in`, segments: [{ key: 'x', value: x.exports }, { key: 'mne', value: x.mneInflow }, { key: 'fund', value: x.fundIncome }] },
      { label: `${lbl(y)}, out`, segments: [{ key: 'energy', value: x.energyImports }, { key: 'imp', value: x.imports - x.energyImports }, { key: 'int', value: x.interestAbroad + x.euContribution + x.otherAbroad }] },
    ];
  });
  const f3 = figure({
    title: 'Foreign currency in and out, € billion a year',
    desc: pick.map((y) => `${y.t === 0 ? 'Today' : `Year ${y.t}`}: current account ${fmt.bn(y.external.currentAccount)}`).join('. ') + `. Exports here are gross, so they include their imported inputs, which also appear in imports.${pastNote}`,
    source: `CSO BPA39 (CA*, 2025) for today; model output for the republic. ${sourcesLink}`,
    tableHtml: tableHTML('Foreign currency in and out (€bn)', ['', 'Irish-owned exports', 'Multinationals’ local spending', 'Fund income', 'Energy imports', 'Other imports', 'Other payments abroad', 'Current account'], pick.map((y) => { const x = y.external; return [lbl(y), x.exports.toFixed(1), x.mneInflow.toFixed(1), x.fundIncome.toFixed(1), x.energyImports.toFixed(1), (x.imports - x.energyImports).toFixed(1), (x.interestAbroad + x.euContribution + x.otherAbroad).toFixed(1), x.currentAccount.toFixed(1)]; })),
  });
  view.querySelector('[data-fig="ext"]').append(f3);
  stackedBars(f3, { rows: extRows, keys: [...extKeys, ...outKeys] });
  timelineCharts(view.querySelector('[data-fig="ext-line"]'), r, { which: ['ca', 'external'] });

  const invRows = r.years.filter((y) => y.t >= 1 && y.t <= 10).map((y) => {
    const f = y.state.financing;
    return [`Year ${y.t}`, y.state.spending.investment.toFixed(1), y.producers.investment.toFixed(1), f.fundDraw.toFixed(1), f.fromSavers.toFixed(1), f.fromCB.toFixed(1), f.gap.toFixed(1)];
  });
  view.querySelector('[data-fig="inv"]').innerHTML = `
    <div class="inv-grid">
      <div><h3>Who decides</h3><ul>
        <li><a href="#/map?node=investment-council">National Investment Council</a>: the five-year plan, negotiated (Art. 56), approved by the Assembly and the Congress of Councils.</li>
        <li><a href="#/map?node=local-assemblies">Local assemblies</a>: at least a third of each county’s capital budget (Art. 57).</li>
        <li><a href="#/map?node=public-bank">Public bank and credit unions</a>: credit by published criteria (Art. 61.6).</li>
        <li><a href="#/map?node=social-wealth-fund">Social Wealth Fund</a>: long-term investment from windfall and returns, never current spending (Art. 60).</li>
        <li><a href="#/map?node=central-bank">Central Bank</a>: lends to the State only within the ceiling the Assembly votes (Art. 61.4).</li>
        <li><a href="#/map?node=ecological-authority">Ecological Authority</a>: a veto over the plan's physical budgets (Art. 64).</li>
      </ul></div>
      <div><h3>How soft budgets are avoided</h3><p>No right to have losses covered; any rescue needs a published vote with its cost (Art. 54); open books (Art. 59). ${fmChip('FM-06', { long: true })} ${fmChip('FM-08', { long: true })}</p>
      <p class="small">In the model, ${Math.round(D.investment_waste_max * (1 - sliders.participation) * 100)}% of public investment is wasted at the current participation setting (${Math.round(sliders.participation * 100)}%). This link is the drafter's assumption.</p></div>
    </div>
    ${tableHTML('Investment and how the State’s borrowing is financed, years 1–10 (€bn)', ['Year', 'Public investment', 'Enterprise investment', 'From the Fund', 'From savers', 'From the Central Bank', 'Unfinanced'], invRows)}`;
  timelineCharts(view.querySelector('[data-fig="timeline"]'), r, { which: ['prices', 'jobs', 'wages'] });
}

// ---------------------------------------------------------------------------------------------
function pressureView(main) {
  const view = main.querySelector('.view');
  view.innerHTML = `
    ${illustrative}
    <form class="pressure-form" aria-label="Pressure explorer settings">
      ${Object.entries(SL)
        .map(([k, s]) => {
          const pctUnit = s.unit === 'share';
          return `<div class="slider" data-k="${k}">
            <label for="sl-${k}">${esc(s.label)}</label>
            <div class="slider-row">
              <input type="range" id="sl-${k}" name="${k}" min="${s.min}" max="${s.max}" step="${s.step}" value="${sliders[k]}" aria-describedby="sl-${k}-src sl-${k}-tip">
              <output for="sl-${k}" id="sl-${k}-out">${esc(sliderText(k))}</output>
            </div>
            <p class="slider-range small">${pctUnit ? `${Math.round(s.min * 100)}% to ${Math.round(s.max * 100)}%` : `${s.min} to ${s.max}`}; central setting ${esc(sliderText(k, s.default))}. <span id="sl-${k}-tip" class="tip-point"></span></p>
            <details class="slider-src"><summary>Why this range</summary><p id="sl-${k}-src">${esc(s.range_source)}</p></details>
            <p class="slider-links">${(s.fms || []).map((f) => fmChip(f)).join(' ')} ${(s.stress || []).filter((id) => scenarios[id]).map((id) => `<a href="#/stress/${id}">${esc(scenarios[id].title_en)}</a>`).join(' · ')}</p>
          </div>`;
        })
        .join('')}
      <p><button type="button" class="button" data-reset-sliders>Back to the central settings</button></p>
    </form>
    <div class="pressure-results" aria-live="polite"></div>
    <div class="fig-slot pressure-charts"></div>`;
  const form = view.querySelector('form');
  let pending = false;
  const update = () => {
    pending = false;
    for (const k of Object.keys(SL)) view.querySelector(`#sl-${k}-out`).textContent = sliderText(k);
    history.replaceState(null, '', `#/economy/pressure${sliderQuery() ? '?' + sliderQuery() : ''}`);
    const r = run(params, sliders);
    const { first, list } = breakSummary(r);
    const y10 = r.years[10];
    view.querySelector('.pressure-results').innerHTML = `
      ${first == null ? `<p class="verdict ok"><strong>Stays afloat</strong>: nothing breaks in the ${D.horizon} years modelled.</p>` : `<p class="verdict broken"><strong>Breaks in year ${first}.</strong> ${list.map((b) => `${esc(b.label)} (year ${b.t})`).join('. ')}.</p>`}
      <dl class="result-tiles">
        <div><dt>Budget balance, year 10</dt><dd>${fmt.pct(y10.state.balance / y10.output.gniStar)} of GNI*</dd></div>
        <div><dt>Debt, year 10</dt><dd>${Math.round(100 * y10.indicators.debtToGni)}% of GNI*</dd></div>
        <div><dt>Reserves, year 10</dt><dd>${fmt.num(y10.external.reserveMonths)} months</dd></div>
        <div><dt>Peak inflation</dt><dd>${fmt.pct(Math.max(...r.years.map((y) => y.prices.inflation)))}</dd></div>
        <div><dt>Unemployment, year 10</dt><dd>${fmt.pct(y10.employment.unemployment)}</dd></div>
        <div><dt>Real wages, year 10</dt><dd>${Math.round(100 * y10.indicators.realWage)} (today = 100)</dd></div>
      </dl>`;
    // tipping points (only for the sliders where a single point exists)
    for (const k of Object.keys(SL)) {
      const tp = tippingPoint(params, sliders, k);
      const el = view.querySelector(`#sl-${k}-tip`);
      const s = SL[k];
      const t = (v) => (s.unit === 'share' ? `${Math.round(v * 100)}%` : `${+v.toFixed(2)}`);
      if (tp == null) el.textContent = `Even at the most favourable end of this range, something breaks within ten years, with the other settings as they are.`;
      else if (tp === (s.better_when_higher ? s.min : s.max)) el.textContent = `Nothing breaks within ten years anywhere in this range, with the other settings as they are.`;
      else el.innerHTML = `<strong>Tipping point: ${s.better_when_higher ? 'at least' : 'up to'} ${t(tp)}</strong> before something breaks within ten years, with the other settings as they are.`;
    }
    const slot = view.querySelector('.pressure-charts');
    slot.innerHTML = '';
    timelineCharts(slot, r, { which: ['budget', 'external', 'prices', 'jobs'] });
    slot.insertAdjacentHTML(
      'beforeend',
      `<details class="year-table"><summary>Every year, as a table</summary>${tableHTML(
        'Model results by year',
        ['Year', 'GNI* (€bn)', 'Balance (% GNI*)', 'Unfinanced gap (€bn)', 'Debt (% GNI*)', 'Current account (% GNI*)', 'Reserves (months)', 'Inflation', 'Unemployment', 'Real wages'],
        r.years.map((y) => [y.t === 0 ? 'Today' : `Year ${y.t}`, y.output.gniStar.toFixed(0), fmt.pct(y.state.balance / y.output.gniStar), y.state.financing.gap.toFixed(1), `${Math.round(100 * y.indicators.debtToGni)}%`, fmt.pct(y.indicators.caToGni), y.exited ? fmt.num(y.external.reserveMonths) : '—', fmt.pct(y.prices.inflation), fmt.pct(y.employment.unemployment), Math.round(100 * y.indicators.realWage)])
      )}</details>`
    );
  };
  form.addEventListener('input', (ev) => {
    const i = ev.target;
    if (i.type !== 'range') return;
    sliders[i.name] = parseFloat(i.value);
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  });
  form.addEventListener('change', (ev) => {
    if (ev.target.type === 'range') announce(`${SL[ev.target.name].label}: ${sliderText(ev.target.name)}`);
  });
  update();
}

// ---------------------------------------------------------------------------------------------
function modelView(main) {
  const view = main.querySelector('.view');
  const cal = run(params, DEFAULTS).calibration;
  const spec = modelMd.split('## 9. Every parameter')[0].replace(/^# .*\n/, '');
  const group = (g, title) => {
    const rows = Object.entries(params[g]).filter(([k]) => !k.startsWith('_'));
    return tableHTML(title, ['Parameter', 'Value', 'Unit', 'Kind', 'Source or reason'], rows.map(([k, v]) => [`${esc(v.label)} <code>${esc(k)}</code>`, esc(String(v.value)), esc(v.unit), `<span class="kind kind-${v.kind}">${KIND_LABEL[v.kind] || esc(v.kind)}</span>`, esc(v.source)]), { numericFrom: 1 });
  };
  view.innerHTML = `
    <div class="prose model-spec">${renderMarkdown(spec)}</div>
    <h2 id="calibration">Calibrated values, at the current parameters</h2>
    ${tableHTML('Calibration', ['Coefficient', 'Value'], [
      ['Import share of household consumption', fmt.pct(cal.m_c)],
      ['Share of household income spent', cal.c.toFixed(3)],
      ['Share of the after-tax domestic surplus paid to households', fmt.pct(cal.propertyShare)],
      ['Other net payments abroad (to match CA*)', fmt.bn(cal.otherNetAbroad0)],
      ['Energy share of consumption imports', fmt.pct(cal.sigma_c)],
      ['Energy share of other imports', fmt.pct(cal.sigma_p)],
    ])}
    <h2 id="parameters">Every parameter</h2>
    <p>Read live from <code>design/economy-params.json</code>. <span class="kind kind-assumption">Assumption</span> marks the drafter's judgement; <span class="kind kind-derived">Derived</span> is arithmetic on cited data; <span class="kind kind-data">Data</span> is from a cited source.</p>
    ${group('baseline', 'Baseline: Ireland in 2025')}
    ${group('design', 'Design and behaviour')}
    ${group('breaks', 'Where it breaks')}
    ${tableHTML('The sliders', ['Slider', 'Range', 'Central', 'Source for the range'], Object.entries(SL).map(([k, s]) => [esc(s.label), `${s.min} to ${s.max}`, String(s.default), esc(s.range_source)]))}`;
  // wide code blocks scroll sideways: make them reachable by keyboard
  view.querySelectorAll('pre').forEach((pre) => {
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', 'Equations');
  });
}

// ---------------------------------------------------------------------------------------------
export default function economy(main, { rest, params: qp }) {
  const cur = VIEWS.some((v) => v.id === (rest[0] || '')) ? rest[0] || '' : '';
  readSliders(qp);
  const v = VIEWS.find((x) => x.id === cur);
  main.innerHTML = `<div class="econ-root">
    <div class="page-head">
      ${bi('An Geilleagar', 'Economy')}
      <p class="lede">How the republic's economy is owned and run, where its money and its energy go, and how it stays afloat outside the EU with its own currency. Built on Ireland's real accounts; the model's every assumption is labelled.</p>
    </div>
    ${viewNav(cur)}
    ${cur ? bi(v.ga, v.en, 2, ' class="bi view-title"') : ''}
    <div class="view"></div></div>`;
  ({ '': overview, structure: structureView, flows: (m) => flowsView(m, qp), afloat: afloatView, pressure: pressureView, model: modelView })[cur](main);
  // listeners go on the page's own root, which is replaced on every render
  main.querySelector('.econ-root').addEventListener('click', (ev) => {
    if (!ev.target.closest('[data-reset-sliders]')) return;
    sliders = { ...DEFAULTS };
    announce('Settings restored to the central values');
    const target = `#/economy${cur ? '/' + cur : ''}`;
    if (location.hash === target) economy(main, { rest, params: new URLSearchParams() });
    else location.hash = target;
  });
}
