// Builds the simplified boundary files in content/geo/ from the source downloads.
// Run once by hand; the outputs are committed. Nothing here runs at site build time.
//
//   node scripts/geo/boundaries.mjs <la.geojson> <ne_map_subunits.geojson> [out-dir]
//
// <la.geojson>: Tailte Éireann, "Local Authorities – National Statutory Boundaries –
//   Ungeneralised" (2024), GeoJSON in Irish Transverse Mercator (EPSG:2157). CC BY 4.0.
// <ne_map_subunits.geojson>: Natural Earth 10m admin-0 map subunits. Public domain.
//   Northern Ireland = the island outline from Natural Earth minus the State, so the
//   border is exactly the Tailte Éireann line.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [laSrc, neSrc, outDir = 'content/geo'] = process.argv.slice(2);
if (!laSrc || !neSrc) {
  console.error('usage: node scripts/geo/boundaries.mjs <la.geojson> <ne_map_subunits.geojson> [out-dir]');
  process.exit(1);
}
const tmp = await mkdtemp(join(tmpdir(), 'geo-'));
// The mapshaper CLI (a dev dependency); its own launcher sets a large enough stack for the dissolve.
const run = (cmd) => execFileSync('npx', ['mapshaper', '-quiet', ...cmd.match(/"[^"]*"|\S+/g).map((a) => a.replace(/^"|"$/g, ''))], { stdio: 'inherit' });

// Display names. The Irish names of the councils come from the source, except Tipperary,
// whose source value repeats a syllable ("Thiobraid Árannraid Árann") and is corrected here.
const LA = {
  'CARLOW COUNTY COUNCIL': ['carlow', 'Carlow County Council', 'Carlow'],
  'CAVAN COUNTY COUNCIL': ['cavan', 'Cavan County Council', 'Cavan'],
  'CLARE COUNTY COUNCIL': ['clare', 'Clare County Council', 'Clare'],
  'CORK CITY COUNCIL': ['cork-city', 'Cork City Council', 'Cork'],
  'CORK COUNTY COUNCIL': ['cork-county', 'Cork County Council', 'Cork'],
  'DONEGAL COUNTY COUNCIL': ['donegal', 'Donegal County Council', 'Donegal'],
  'DUBLIN CITY COUNCIL': ['dublin-city', 'Dublin City Council', 'Dublin'],
  'DUN LAOGHAIRE-RATHDOWN COUNTY COUNCIL': ['dlr', 'Dún Laoghaire–Rathdown County Council', 'Dublin'],
  'FINGAL COUNTY COUNCIL': ['fingal', 'Fingal County Council', 'Dublin'],
  'SOUTH DUBLIN COUNTY COUNCIL': ['south-dublin', 'South Dublin County Council', 'Dublin'],
  'GALWAY CITY COUNCIL': ['galway-city', 'Galway City Council', 'Galway'],
  'GALWAY COUNTY COUNCIL': ['galway-county', 'Galway County Council', 'Galway'],
  'KERRY COUNTY COUNCIL': ['kerry', 'Kerry County Council', 'Kerry'],
  'KILDARE COUNTY COUNCIL': ['kildare', 'Kildare County Council', 'Kildare'],
  'KILKENNY COUNTY COUNCIL': ['kilkenny', 'Kilkenny County Council', 'Kilkenny'],
  'LAOIS COUNTY COUNCIL': ['laois', 'Laois County Council', 'Laois'],
  'LEITRIM COUNTY COUNCIL': ['leitrim', 'Leitrim County Council', 'Leitrim'],
  'LIMERICK CITY AND COUNTY COUNCIL': ['limerick', 'Limerick City and County Council', 'Limerick'],
  'LONGFORD COUNTY COUNCIL': ['longford', 'Longford County Council', 'Longford'],
  'LOUTH COUNTY COUNCIL': ['louth', 'Louth County Council', 'Louth'],
  'MAYO COUNTY COUNCIL': ['mayo', 'Mayo County Council', 'Mayo'],
  'MEATH COUNTY COUNCIL': ['meath', 'Meath County Council', 'Meath'],
  'MONAGHAN COUNTY COUNCIL': ['monaghan', 'Monaghan County Council', 'Monaghan'],
  'OFFALY COUNTY COUNCIL': ['offaly', 'Offaly County Council', 'Offaly'],
  'ROSCOMMON COUNTY COUNCIL': ['roscommon', 'Roscommon County Council', 'Roscommon'],
  'SLIGO COUNTY COUNCIL': ['sligo', 'Sligo County Council', 'Sligo'],
  'TIPPERARY COUNTY COUNCIL': ['tipperary', 'Tipperary County Council', 'Tipperary'],
  'WATERFORD CITY AND COUNTY COUNCIL': ['waterford', 'Waterford City and County Council', 'Waterford'],
  'WESTMEATH COUNTY COUNCIL': ['westmeath', 'Westmeath County Council', 'Westmeath'],
  'WEXFORD COUNTY COUNCIL': ['wexford', 'Wexford County Council', 'Wexford'],
  'WICKLOW COUNTY COUNCIL': ['wicklow', 'Wicklow County Council', 'Wicklow'],
};
const GA_FIX = { 'Comhairle Contae Thiobraid Árannraid Árann': 'Comhairle Contae Thiobraid Árann' };
const COUNTY_GA = {
  Carlow: 'Ceatharlach', Cavan: 'An Cabhán', Clare: 'An Clár', Cork: 'Corcaigh', Donegal: 'Dún na nGall',
  Dublin: 'Baile Átha Cliath', Galway: 'Gaillimh', Kerry: 'Ciarraí', Kildare: 'Cill Dara', Kilkenny: 'Cill Chainnigh',
  Laois: 'Laois', Leitrim: 'Liatroim', Limerick: 'Luimneach', Longford: 'An Longfort', Louth: 'Lú', Mayo: 'Maigh Eo',
  Meath: 'An Mhí', Monaghan: 'Muineachán', Offaly: 'Uíbh Fhailí', Roscommon: 'Ros Comáin', Sligo: 'Sligeach',
  Tipperary: 'Tiobraid Árann', Waterford: 'Port Láirge', Westmeath: 'An Iarmhí', Wexford: 'Loch Garman', Wicklow: 'Cill Mhantáin',
};
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');

// 1. Local authorities: dissolve the parts, measure area in ITM metres, reproject, simplify.
//    Simplified by distance (200 m), dropping islands under 2 km² and slivers under 1 km².
run(
  `-i "${laSrc}" -dissolve ENG_NAME_VALUE copy-fields=GLE_NAME_VALUE,BDY_TYPE_VALUE ` +
    `-each "area_km2=Math.round(this.area/1e4)/100" -proj from=EPSG:2157 crs=wgs84 ` +
    `-o "${tmp}/state-full.json" format=geojson precision=0.0001`
);
run(
  `-i "${tmp}/state-full.json" -simplify interval=200 keep-shapes -filter-islands min-area=2000000 ` +
    `-filter-slivers min-area=1000000 -o "${tmp}/la.json" format=geojson precision=0.0005`
);
const la = JSON.parse(await readFile(`${tmp}/la.json`, 'utf8'));
for (const f of la.features) {
  const p = f.properties;
  const m = LA[p.ENG_NAME_VALUE];
  if (!m) throw new Error(`Unknown local authority: ${p.ENG_NAME_VALUE}`);
  const [id, name_en, county] = m;
  f.properties = {
    id,
    name_en,
    name_ga: GA_FIX[p.GLE_NAME_VALUE] || p.GLE_NAME_VALUE,
    type: /CITY AND COUNTY/.test(p.ENG_NAME_VALUE) ? 'city-county' : p.BDY_TYPE_VALUE === 'City Council' ? 'city' : 'county',
    county,
    county_id: slug(county),
    county_ga: COUNTY_GA[county],
    area_km2: p.area_km2,
  };
}
la.features.sort((a, b) => a.properties.name_en.localeCompare(b.properties.name_en));
await writeFile(`${tmp}/la-named.json`, JSON.stringify(la));

// 2. Northern Ireland: Natural Earth's Ireland + Northern Ireland outline, minus the State.
//    Erased with the simplified State outline, so the border matches the councils' edges exactly.
//    Pieces under 10 km² or outside the north-east are coastline mismatches and are dropped;
//    Rathlin Island (about 14 km²) is kept.
run(
  `-i "${neSrc}" -filter "['IRL','NIR'].indexOf(SU_A3) > -1 || ADM0_A3 === 'IRL'" -dissolve ` +
    `-o "${tmp}/island.json" format=geojson`
);
run(`-i "${tmp}/la-named.json" -dissolve -o "${tmp}/state.json" format=geojson`);
run(
  `-i "${tmp}/island.json" -erase "${tmp}/state.json" -explode -proj crs=EPSG:2157 ` +
    `-each "A=this.area" -proj crs=wgs84 ` +
    `-filter "A > 1e7 && this.centroidY > 54 && this.centroidX > -8.3" -dissolve ` +
    `-each "id='north',name_en='Northern Ireland',name_ga='Tuaisceart Éireann'" ` +
    `-o "${tmp}/north.json" format=geojson precision=0.0005`
);

// 3. One TopoJSON file with two objects, "la" and "north", sharing the border arcs.
//    The 26 counties are merged from "la" in the browser (topojson-client merge).
run(
  `-i "${tmp}/la-named.json" "${tmp}/north.json" combine-files ` +
    `-rename-layers la,north -o "${outDir}/ireland.topo.json" format=topojson quantization=100000`
);
const topo = JSON.parse(await readFile(`${outDir}/ireland.topo.json`, 'utf8'));
topo.meta = {
  generated: new Date().toISOString().slice(0, 10),
  la: 'Tailte Éireann, Local Authorities – National Statutory Boundaries – Ungeneralised (2024). CC BY 4.0. © Tailte Éireann. Generalised here: simplified to 200 m, islands under 2 km² omitted. For reference only.',
  north: 'Natural Earth 10m admin-0 map subunits (public domain), minus the Tailte Éireann outline of the State.',
  area_km2: 'Computed from the unsimplified Tailte Éireann boundaries in Irish Transverse Mercator (EPSG:2157).',
};
await writeFile(`${outDir}/ireland.topo.json`, JSON.stringify(topo));
console.log(`wrote ${outDir}/ireland.topo.json: ${la.features.length} local authorities and Northern Ireland`);
