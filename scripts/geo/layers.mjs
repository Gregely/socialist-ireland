// Builds content/geo/data-now.json, the real data behind "Ireland now", from CSO PxStat tables.
// Run by hand when a table is updated; the output is committed. Nothing here runs at site build time.
//
//   node scripts/geo/layers.mjs [cache-dir]
//
// Each table is read from <cache-dir>/<TABLE>.json if present, otherwise downloaded from the
// CSO API (JSON-stat 2.0) and saved there. All CSO data is published under CC BY 4.0.
// Only published figures are used. Nothing is estimated or interpolated; the only arithmetic
// is summing Dublin's postal districts, summing quarters, and dividing by area or by a total.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const cache = process.argv[2] || 'geo-cache';
await mkdir(cache, { recursive: true });
const API = 'https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset';

async function table(code) {
  const file = join(cache, `${code}.json`);
  if (!existsSync(file)) {
    const res = await fetch(`${API}/${code}/JSON-stat/2.0/en`);
    if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
    await writeFile(file, await res.text());
  }
  const d = JSON.parse(await readFile(file, 'utf8'));
  return {
    d,
    code,
    title: d.label,
    updated: d.updated?.slice(0, 10),
    /** Value for {dimension label: category label}; dimensions not named take their first category. */
    get(sel) {
      let idx = 0;
      let stride = 1;
      for (let i = d.id.length - 1; i >= 0; i--) {
        const dim = d.dimension[d.id[i]];
        const labels = dim.category.label;
        const index = dim.category.index;
        const want = sel[dim.label] ?? sel[d.id[i]];
        let key = Array.isArray(index) ? index[0] : Object.keys(index)[0];
        if (want !== undefined) {
          key = Object.keys(labels).find((k) => labels[k] === want);
          if (key === undefined) throw new Error(`${code}: no "${want}" in ${dim.label}`);
        }
        const pos = Array.isArray(index) ? index.indexOf(key) : index[key];
        idx += pos * stride;
        stride *= d.size[i];
      }
      const v = Array.isArray(d.value) ? d.value[idx] : d.value[idx];
      return v === undefined ? null : v;
    },
    labels(dimLabel) {
      const id = d.id.find((k) => d.dimension[k].label === dimLabel);
      return Object.values(d.dimension[id].category.label);
    },
  };
}

// Place names as the CSO writes them → ids used by content/geo/ireland.topo.json.
// Census 2022 tables publish Cork City and Cork County as one unit ("cork"), so those layers use
// the "census2022" geography: the 31 councils with the two Cork councils merged.
const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^co\.\s*/, '')
    .replace(/council/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z]/g, '');
const SPECIAL = {
  corkcity: 'cork-city', corkcounty: 'cork-county', corkcityandcorkcounty: 'cork',
  dublincity: 'dublin-city', dunlaoghairerathdown: 'dlr', southdublin: 'south-dublin',
  galwaycity: 'galway-city', galwaycounty: 'galway-county',
  limerickcityandcounty: 'limerick', waterfordcityandcounty: 'waterford',
};
function laId(label) {
  const k = norm(label);
  if (SPECIAL[k]) return SPECIAL[k];
  const bare = k.replace(/county$/, '');
  if (SPECIAL[bare]) return SPECIAL[bare];
  return LAS.some((p) => p.id === bare) ? bare : null;
}
const topo = JSON.parse(await readFile('content/geo/ireland.topo.json', 'utf8'));
const LAS = topo.objects.la.geometries.map((g) => g.properties);
const COUNTIES = [...new Set(LAS.map((p) => p.county_id))];
const countyArea = Object.fromEntries(
  COUNTIES.map((c) => [c, LAS.filter((p) => p.county_id === c).reduce((s, p) => s + p.area_km2, 0)])
);

function laValues(t, dimLabel, sel, skip = /^(state|ireland)$/i) {
  const out = {};
  for (const label of t.labels(dimLabel)) {
    if (skip.test(label)) continue;
    const id = laId(label);
    if (!id) throw new Error(`${t.code}: cannot match local authority "${label}"`);
    out[id] = t.get({ ...sel, [dimLabel]: label });
  }
  const units = out.cork != null ? LAS.map((p) => (p.county_id === 'cork' ? 'cork' : p.id)) : LAS.map((p) => p.id);
  const missing = [...new Set(units)].filter((id) => out[id] == null);
  if (missing.length) throw new Error(`${t.code}: missing ${missing.join(', ')}`);
  return out;
}
function countyValues(t, dimLabel, sel, label = (c) => c) {
  const out = {};
  for (const c of COUNTIES) {
    const name = LAS.find((p) => p.county_id === c).county;
    out[c] = t.get({ ...sel, [dimLabel]: label(name) });
    if (out[c] == null) throw new Error(`${t.code}: missing ${name}`);
  }
  return out;
}
const round = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;
const src = (t) => ({ table: t.code, title: t.title, updated: t.updated, url: `https://data.cso.ie/table/${t.code}` });

// ---- Rents: RTB average monthly rent, all bedrooms, all property types, 2025
const ria = await table('RIA02');
const rentYear = ria.labels('Year').at(-1);
const rent = {
  geography: 'county',
  period: rentYear,
  values: countyValues(ria, 'Location', { Year: rentYear, 'Number of Bedrooms': 'All bedrooms', 'Property Type': 'All property types' }),
  source: src(ria),
};

// ---- Vacancy, Census 2022 (all private households)
const f2027 = await table('F2027');
const vacancyCensus = {
  geography: 'census2022',
  period: '2022',
  values: laValues(f2027, 'County and City', { Statistic: 'Vacancy Rate', CensusYear: '2022', 'Type of Private Household': 'All households' }),
  national: f2027.get({ Statistic: 'Vacancy Rate', CensusYear: '2022', 'County and City': 'State', 'Type of Private Household': 'All households' }),
  source: src(f2027),
};

// ---- Vacancy indicated by electricity meters (VAC14), latest quarter
const vac = await table('VAC14');
const q = vac.labels('Quarter').at(-1);
const vacancyMeter = {
  geography: 'la',
  period: q.replace('Q', ' Q'),
  values: laValues(vac, 'Local Authority', { Statistic: 'Vacancy Rate', Quarter: q }),
  counts: laValues(vac, 'Local Authority', { Statistic: 'Number of Vacant Dwellings', Quarter: q }),
  source: src(vac),
};

// ---- Cattle in June (AAA11): total and dairy cows; density per km² of county area
const aaa = await table('AAA11');
const herdYear = aaa.labels('Year').at(-1);
const cattle = countyValues(aaa, 'County', { Year: herdYear, 'Type of Cattle': 'Total cattle' }, (c) => `Co. ${c}`);
const dairy = countyValues(aaa, 'County', { Year: herdYear, 'Type of Cattle': 'Dairy cows' }, (c) => `Co. ${c}`);
const herd = {
  geography: 'county',
  period: `June ${herdYear}`,
  values: Object.fromEntries(COUNTIES.map((c) => [c, Math.round((cattle[c] * 1000) / countyArea[c])])),
  total_thousands: cattle,
  dairy_thousands: dairy,
  national_thousands: round(Object.values(cattle).reduce((a, b) => a + b, 0)),
  source: src(aaa),
};

// ---- Metered electricity (MEC03): non-residential GWh by county, Dublin = postal districts + Co. Dublin
const mec = await table('MEC03');
const elecYear = mec.labels('Year').at(-1);
const locs = mec.labels('Counties & Dublin Postal Districts');
const sector = (s) =>
  Object.fromEntries(
    COUNTIES.map((c) => {
      const name = LAS.find((p) => p.county_id === c).county;
      const parts = c === 'dublin' ? locs.filter((l) => /^Dublin \d/.test(l) || l === 'Co. Dublin') : [`Co. ${name}`];
      const sum = parts.reduce((acc, l) => acc + mec.get({ Year: elecYear, 'Counties & Dublin Postal Districts': l, Sector: s }), 0);
      return [c, Math.round(sum)];
    })
  );
const nonRes = sector('20 Non-residential');
const notCoded = mec.get({ Year: elecYear, 'Counties & Dublin Postal Districts': 'Not coded', Sector: '20 Non-residential' });
const mec02 = await table('MEC02');
const quarters = mec02.labels('Quarter').filter((x) => x.startsWith(elecYear));
const sumQ = (what) => quarters.reduce((a, qq) => a + mec02.get({ Quarter: qq, 'Electricity Consumption': what }), 0);
const dcGWh = sumQ('Data centres');
const allGWh = sumQ('All metered electricity consumption');
const electricity = {
  geography: 'county',
  period: elecYear,
  values: nonRes,
  residential: sector('10 Residential'),
  not_coded_gwh: Math.round(notCoded),
  dublin_parts: locs.filter((l) => /^Dublin \d/.test(l) || l === 'Co. Dublin').length,
  national_data_centres: {
    period: elecYear,
    quarters: quarters.length,
    gwh: Math.round(dcGWh),
    all_gwh: Math.round(allGWh),
    share_pct: round((dcGWh / allGWh) * 100),
    source: src(mec02),
  },
  source: src(mec),
};

// ---- Peat bogs drained under state schemes (EAP09), with peat-bog extent (EAP03)
const eap9 = await table('EAP09');
const eap3 = await table('EAP03');
const peat = {
  geography: 'county',
  period: '2018',
  // mapped: hectares drained (the proportion misleads where a county has little bog, e.g. Meath)
  values: countyValues(eap9, 'County', { Statistic: 'Area of Benefiting Peat Bogs' }, (c) => `Co. ${c}`),
  proportion_pct: countyValues(eap9, 'County', { Statistic: 'Proportion of Benefiting Peat Bogs' }, (c) => `Co. ${c}`),
  bog_ha: countyValues(eap3, 'County', { Statistic: 'Peat bogs' }, (c) => `Co. ${c}`),
  source: src(eap9),
  source_extent: src(eap3),
};

// ---- Population by local authority, Census 2022 (also used for the local-assembly counts)
const f1004 = await table('F1004A');
const population = {
  period: '2022',
  values: laValues(f1004, 'Administrative Counties', { Sex: 'Both sexes' }),
  national: f1004.get({ Sex: 'Both sexes', 'Administrative Counties': 'Ireland' }),
  source: src(f1004),
};

// ---- Unpaid carers, Census 2022: carers (SAP theme 12.2) per 100 residents of each council area.
//      The only arithmetic is count ÷ population. (F4068 is a distribution by hours, not a rate.)
const sap = await table('SAP2022T12T2CTY');
const carerCounts = laValues(sap, 'Administrative Counties', { Sex: 'Both Sexes' });
const carerNational = sap.get({ Sex: 'Both Sexes', 'Administrative Counties': 'Ireland' });
const carers = {
  geography: 'la',
  period: '2022',
  values: Object.fromEntries(Object.entries(carerCounts).map(([id, n]) => [id, round((n / population.values[id]) * 100, 2)])),
  counts: carerCounts,
  national: round((carerNational / population.national) * 100, 2),
  national_count: carerNational,
  source: src(sap),
  source_population: src(f1004),
};

const out = {
  note: 'Generated by scripts/geo/layers.mjs from CSO PxStat tables (CC BY 4.0). Do not edit by hand; edit the text in content/geo/layers.json.',
  generated: new Date().toISOString().slice(0, 10),
  layers: {
    rent,
    'vacancy-census': vacancyCensus,
    'vacancy-meter': vacancyMeter,
    herd,
    electricity,
    peat,
    carers,
  },
  population,
  county_area_km2: Object.fromEntries(Object.entries(countyArea).map(([k, v]) => [k, round(v)])),
};
await writeFile('content/geo/data-now.json', JSON.stringify(out, null, 1));
console.log('wrote content/geo/data-now.json');
for (const [id, l] of Object.entries(out.layers)) {
  const v = Object.values(l.values);
  console.log(`  ${id}: ${l.geography}, ${l.period}, n=${v.length}, min ${Math.min(...v)}, max ${Math.max(...v)}`);
}
console.log('  data centres', electricity.national_data_centres);
