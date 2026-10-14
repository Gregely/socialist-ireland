// Unit tests for the economy model: the accounting identities must hold at every slider position.
// No browser. Run: node tests/economy.mjs
//
// Checked in every year of every run:
//   1. Sectoral balances: households + producers + State = current account (sources = uses).
//   2. Output: domestic value added = domestic content of consumption, public spending,
//      investment, exports and multinationals' purchases (the expenditure identity).
//   3. The budget closes: revenue − spending = balance, and the borrowing need is exactly met by
//      the Fund, savers, the Central Bank and any unfinanced gap (or, in surplus, by repayment and
//      saving into the Fund).
//   4. The debt stock moves by exactly the borrowing plus the revaluation of euro debt.
//   5. The balance of payments closes: the change in reserves equals the current account, minus
//      capital flight, plus Fund assets sold, minus windfall and surpluses invested abroad.
//   6. The baseline year reproduces the baseline data it was calibrated on.
import { readFile } from 'node:fs/promises';
import { run, calibrate, values } from '../src/lib/economy-model.js';

const params = JSON.parse(await readFile(new URL('../design/economy-params.json', import.meta.url), 'utf8'));
const B = values(params.baseline);
const ids = Object.keys(params.sliders);
let checks = 0;
const failures = [];

function near(a, b, scale, what, ctx) {
  checks++;
  const tol = 1e-7 * Math.max(1, Math.abs(scale));
  if (!(Math.abs(a - b) <= tol) || !Number.isFinite(a) || !Number.isFinite(b)) {
    failures.push(`${what}: ${a} ≠ ${b} (diff ${a - b}) at ${ctx}`);
  }
}

function checkRun(sl, label) {
  const r = run(params, sl);
  let prev = null;
  for (const y of r.years) {
    const ctx = `${label}, year ${y.t}`;
    const scale = y.output.gniStar;
    const { H_nl, P_nl, G_nl, CA } = y.check;
    // 1. sectoral balances
    near(H_nl + P_nl + G_nl, CA, scale, 'sectoral balances (H + P + G = CA)', ctx);
    // 2. expenditure identity for domestic value added
    const d = y.demand;
    const p = y.prices;
    const domesticG = d.G_nom - y.state.spending.jobGuarantee; // services incl. imported content
    const exportImportContent = d.X_nom; // gross exports
    const imported = y.external.imports;
    const lhs = y.output.valueAdded;
    const rhs = d.C_nom + d.G_nom + d.I_pub_nom + d.I_priv_nom + d.X_nom + d.mnePurchases - imported;
    near(lhs, rhs, scale, 'expenditure identity (VA = C + G + I + X + MNE purchases − M)', ctx);
    void domesticG; void exportImportContent; void p;
    // 3. budget
    const st = y.state;
    const rev = Object.values(st.revenue).reduce((a, b) => a + b, 0);
    const spe = Object.values(st.spending).reduce((a, b) => a + b, 0);
    near(rev - spe, st.balance, scale, 'budget: revenue − spending = balance', ctx);
    const f = st.financing;
    if (f.need > 0) near(f.fundDraw + f.fromSavers + f.fromCB + f.gap, f.need, scale, 'budget: financing = borrowing need', ctx);
    else near(f.repay + f.toFund, -f.need, scale, 'budget: surplus = repayment + saving into Fund', ctx);
    // household budget
    const h = y.households;
    near(h.disposable - h.consumption - h.vat, h.saving, scale, 'households: income = outlays + saving', ctx);
    // 4. debt stock-flow
    if (prev) {
      const borrowed = f.fromSavers + f.fromCB + f.gap - f.repay;
      near(st.debt, prev.state.debt + borrowed + st.revaluation, scale, 'debt: stock = previous + borrowing + revaluation', ctx);
      // 5. reserves
      const flow = y.external.currentAccount - y.external.flight + f.fundDraw - st.revenue.windfall - f.toFund;
      near(y.external.reserves, y.external.reservesBefore * (p.e / prev.prices.e) + flow, scale, 'balance of payments: Δreserves = CA − flight + Fund sales − Fund purchases', ctx);
    }
    prev = y;
  }
  // 6. baseline reproduction (year 0, before any shock)
  const y0 = r.years[0];
  near(y0.producers.valueAdded, B.domestic_va, B.domestic_va, 'calibration: domestic value added', label);
  near(y0.households.consumption, B.household_consumption, B.household_consumption, 'calibration: household consumption', label);
  return r;
}

// slider grid: every slider at min, default and max with the others at default; every pair at
// their extremes; and random positions
const S = params.sliders;
const def = Object.fromEntries(ids.map((k) => [k, S[k].default]));
let runs = 0;
checkRun(def, 'defaults');
runs++;
for (const k of ids) {
  for (const v of [S[k].min, S[k].max]) {
    checkRun({ ...def, [k]: v }, `${k}=${v}`);
    runs++;
  }
}
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    for (const a of ['min', 'max']) {
      for (const b of ['min', 'max']) {
        checkRun({ ...def, [ids[i]]: S[ids[i]][a], [ids[j]]: S[ids[j]][b] }, `${ids[i]}=${a},${ids[j]}=${b}`);
        runs++;
      }
    }
  }
}
let seed = 20261014;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
for (let n = 0; n < 300; n++) {
  const sl = Object.fromEntries(ids.map((k) => [k, S[k].min + (S[k].max - S[k].min) * rand()]));
  checkRun(sl, `random #${n}`);
  runs++;
}

// the slider steps the page offers must also be valid positions
for (const k of ids) {
  const s = S[k];
  if (!(s.min <= s.default && s.default <= s.max)) failures.push(`slider ${k}: default outside range`);
  if (!s.range_source) failures.push(`slider ${k}: no source for its range`);
}

const cal = calibrate(params);
for (const [k, v] of Object.entries(cal)) if (!Number.isFinite(v)) failures.push(`calibration ${k} is not finite`);
if (!(cal.m_c > 0 && cal.m_c < 1)) failures.push(`calibrated import share of consumption out of range: ${cal.m_c}`);

if (failures.length) {
  console.log(failures.slice(0, 40).join('\n'));
  console.log(`economy FAILED: ${failures.length} of ${checks} checks failed over ${runs} runs`);
  process.exit(1);
}
console.log(`economy OK: ${checks} identity checks over ${runs} runs (${ids.length} sliders); calibrated import share of consumption ${(cal.m_c * 100).toFixed(1)}%`);
