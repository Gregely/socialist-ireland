// Writes the table of every economy-model parameter into design/economy-model.md, between the
// params-table markers, so the specification always matches design/economy-params.json.
//   node scripts/economy/params-table.mjs
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const params = JSON.parse(await readFile(new URL('design/economy-params.json', root), 'utf8'));
const specUrl = new URL('design/economy-model.md', root);
const spec = await readFile(specUrl, 'utf8');
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const KIND = { data: 'Data', derived: 'Derived', assumption: '**Assumption**' };

let out = '';
for (const [group, title] of [['baseline', 'Baseline: Ireland in 2025'], ['design', 'Design and behaviour'], ['breaks', 'Break thresholds']]) {
  out += `\n### ${title}\n\n| Parameter | Value | Unit | Kind | Source |\n|---|---|---|---|---|\n`;
  for (const [k, v] of Object.entries(params[group])) {
    if (k.startsWith('_')) continue;
    out += `| \`${k}\` ${cell(v.label)} | ${cell(v.value)} | ${cell(v.unit)} | ${KIND[v.kind] || cell(v.kind)} | ${cell(v.source)} |\n`;
  }
}
out += `\n### Sliders\n\n| Slider | Range | Default | Failure modes | Source for the range |\n|---|---|---|---|---|\n`;
for (const [k, s] of Object.entries(params.sliders)) {
  out += `| \`${k}\` ${cell(s.label)} | ${s.min} to ${s.max} | ${s.default} | ${(s.fms || []).join(', ')} | ${cell(s.range_source)} |\n`;
}
const next = spec.replace(/<!-- params-table:start -->[\s\S]*<!-- params-table:end -->/, `<!-- params-table:start -->\n${out}\n<!-- params-table:end -->`);
await writeFile(specUrl, next);
console.log(`wrote ${Object.keys(params.baseline).length + Object.keys(params.design).length + Object.keys(params.sliders).length} parameters into design/economy-model.md`);
