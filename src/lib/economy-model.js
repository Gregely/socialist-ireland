// The economy model: a small annual stock-flow accounting model of the republic.
// Pure functions, no DOM: the site and the unit tests (tests/economy.mjs) both import it.
// Every number comes from design/economy-params.json; nothing is hard-coded here except the
// structure of the accounts. The specification, with every equation, is design/economy-model.md.
//
// Units: billions of punts (IR£), current prices. Before exit day the State uses the euro and
// the punt replaces it at par (Art. 104.2), so year-0 values are euro values. People: thousands.
//
// Sectors: households (H); domestic producers (P: public, municipal and co-operative enterprise
// and small private firms); the State (G, consolidated with the Social Wealth Fund); the rest of
// the world (X). Foreign multinationals are treated as part of the rest of the world: what reaches
// the domestic economy from them is what they spend here (wages, taxes, purchases), which is how
// GNI* and the modified current account treat them.
//
// Every flow has a payer and a payee, so the accounts close by construction; tests/economy.mjs
// checks that they do at every slider position.

/** Read a parameter tree into plain numbers: {a: {value: 3}} → {a: 3}. */
export function values(tree) {
  const out = {};
  for (const [k, v] of Object.entries(tree || {})) {
    if (k.startsWith('_')) continue;
    out[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
  }
  return out;
}

/** Slider defaults from the parameter file. */
export function defaultSliders(params) {
  return Object.fromEntries(Object.entries(params.sliders).map(([k, s]) => [k, s.default]));
}

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Share of a change in place in year t, phased in evenly from year `start` over `years` years. */
export const phase = (t, start, years) => (years <= 0 ? (t >= start ? 1 : 0) : clamp((t - start + 1) / years, 0, 1));

/** Calibration: the few coefficients set so the model reproduces the baseline year exactly. */
export function calibrate(params) {
  const B = values(params.baseline);
  const D = values(params.design);
  const I0 = B.public_investment + B.private_investment;
  // import propensity of household consumption: the residual that makes domestic value added match
  const A0 = (1 - D.m_g) * B.gov_consumption + (1 - D.m_i) * I0 + (1 - D.m_x) * B.domestic_exports + B.mne_purchases;
  const m_c = 1 - (B.domestic_va - A0) / B.household_consumption;
  // energy's share of the imports in consumption, and of the imports in other final demand
  const sigma_c = B.household_energy_imports / (m_c * B.household_consumption);
  const otherImp0 = D.m_g * B.gov_consumption + D.m_i * I0 + D.m_x * B.domestic_exports;
  const sigma_p = (B.energy_imports - B.household_energy_imports) / otherImp0;
  const omega = B.domestic_wages / B.domestic_va; // wage share of domestic value added
  // households also receive part of the domestic surplus (self-employment, rents, dividends):
  // the share is set so that household disposable income matches the national accounts
  const afterTaxSurplus0 = (B.domestic_va - B.domestic_wages) * (1 - D.t_s);
  const labourTransfer0 = (B.domestic_wages + B.mne_wages) * (1 - D.t_w) + B.transfers - B.other_revenue;
  const interest0 = D.domestic_debt_held_at_home * D.interest_rate * B.public_debt * (1 - D.foreign_law_debt_share);
  const propertyShare = (B.household_disposable_income - labourTransfer0 - interest0) / afterTaxSurplus0;
  const income0 = labourTransfer0 + propertyShare * afterTaxSurplus0;
  const c = (B.household_consumption * (1 + D.t_c)) / income0; // outlay on consumption incl. VAT
  const domesticWorkers = B.employment - B.mne_employment;
  const prodPerHour0 = B.domestic_va / (domesticWorkers * B.hours_per_worker);
  // net payments abroad that the model does not otherwise capture (residents' travel, domestic firms'
  // service imports, other income): set so the baseline current account equals the CSO's CA*
  const debtDom0 = B.public_debt * (1 - D.foreign_law_debt_share);
  const imports0 = m_c * B.household_consumption + otherImp0;
  const caModel0 = B.domestic_exports + B.mne_wages + B.mne_taxes + B.mne_purchases + D.swf_return * B.state_funds - imports0 -
    (1 - D.domestic_debt_held_at_home) * D.interest_rate * debtDom0 - D.interest_rate * B.public_debt * D.foreign_law_debt_share - B.eu_net_contribution;
  const otherNetAbroad0 = caModel0 - B.ca_star;
  return { m_c, sigma_c, sigma_p, omega, c, prodPerHour0, propertyShare, otherNetAbroad0 };
}

/**
 * Run the model.
 * @param {object} params  design/economy-params.json
 * @param {object} sliders slider values keyed by id (missing ones take their defaults)
 * @param {object} [opts]  {years}: last year to run (default params.design.horizon)
 */
export function run(params, sliders = {}, opts = {}) {
  const B = values(params.baseline);
  const D = values(params.design);
  const K = values(params.breaks);
  const S = { ...defaultSliders(params), ...sliders };
  const T = opts.years ?? D.horizon;
  const cal = calibrate(params);
  const { m_c, sigma_c, sigma_p, omega, c, prodPerHour0, propertyShare, otherNetAbroad0 } = cal;
  const I0 = B.public_investment + B.private_investment;

  // ---- stocks at the start
  let debtDomestic = B.public_debt * (1 - D.foreign_law_debt_share);
  let debtForeignFC = B.public_debt * D.foreign_law_debt_share; // stays in euro: measured in foreign currency
  let swfFC = B.state_funds; // Social Wealth Fund, invested abroad: foreign currency
  // usable foreign-currency reserves on exit day: a share of the TARGET claim settled, plus reserves
  let reservesFC = B.fx_reserves + B.target_claim * D.target_settled;
  // private foreign assets: before exit the current-account surplus accumulates here, not in the reserves
  let privateFC = 0;
  let deposits = B.household_deposits;

  // ---- prices
  let P_D = 1; // domestic output
  let e = 1; // punts per unit of foreign currency
  let piC_prev = D.inflation_target;
  let prodIndex = 1;
  let P_C_prev = 1;

  const years = [];
  const breaks = [];
  const tx = D.exit_year;

  for (let t = 0; t <= T; t++) {
    const exited = t >= tx;
    const ePrev = e;
    e = exited ? 1 / (1 - S.devaluation) : 1;
    const foreignPrice = Math.pow(1 + D.foreign_inflation, t);
    const P_M = e * foreignPrice; // imports other than energy, in punts
    const P_E = e * foreignPrice * (1 + (t >= 1 ? S.energy_price : 0)); // imported energy, in punts

    // ---- policy and shock paths ----------------------------------------------------------
    const mShare = 1 - S.mne_exit * phase(t, D.mne_departure_start, D.mne_departure_years);
    const tradeHit = exited ? S.trade_terms : 0; // 0 = zero-tariff agreements, 1 = WTO terms with EU and UK
    const herd = S.herd_reduction * phase(t, 1, D.transition_years);
    const hoursCut = S.hours_reduction * phase(t, 1, D.transition_years);
    const provision = D.provision_expansion * phase(t, 1, D.provision_years);
    const investPush = D.public_investment_push * phase(t, 1, D.provision_years);
    const renew = D.energy_import_cut * phase(t, 1, D.transition_years); // imported energy replaced by domestic renewables
    const growth = Math.pow(1 + D.trend_growth, t);
    const taxUp = D.tax_increase * phase(t, 1, D.provision_years); // extra progressive tax, share of GNI*
    const rate = D.interest_rate + D.interest_rate_rise * phase(t, 1, D.transition_years);
    const waste = D.investment_waste_max * (1 - S.participation);

    // import propensities this year: imports respond to their price relative to domestic goods
    // (expenditure switching), and imported energy is partly replaced by domestic renewables
    const switching = Math.pow((e * foreignPrice) / P_D, -D.import_elasticity); // P_D is still last year's here
    const mc = Math.min(0.95, m_c * switching) * (1 - renew * sigma_c);
    const sc = (sigma_c * (1 - renew)) / (1 - renew * sigma_c);
    const shiftP = 1 - renew * sigma_p;
    const mg = Math.min(0.95, D.m_g * switching) * shiftP;
    const mi = Math.min(0.95, D.m_i * switching) * shiftP;
    const mx = Math.min(0.95, D.m_x * switching) * shiftP;
    const sp = (sigma_p * (1 - renew)) / shiftP;
    const P_Mc = (1 - sc) * P_M + sc * P_E; // price of consumption imports
    const P_Mp = (1 - sp) * P_M + sp * P_E; // price of other imports

    // ---- domestic prices: unit labour cost with partial indexation to last year's inflation
    const piD = t === 0 ? D.inflation_target : D.inflation_target + D.indexation * (piC_prev - D.inflation_target);
    if (t > 0) P_D *= 1 + piD;
    const P_C = (1 - mc) * P_D + mc * P_Mc;

    // ---- real final demand at base-year prices --------------------------------------------
    const realRate = e / P_D;
    const competitiveness = Math.pow(realRate, D.export_elasticity);
    const agriShare = B.agrifood_exports / B.domestic_exports;
    const agriLoss = clamp(tradeHit * D.wto_loss_agrifood + herd * D.herd_export_share, 0, 1);
    const otherLoss = tradeHit * D.wto_loss_other;
    const X = B.domestic_exports * growth * competitiveness * (agriShare * (1 - agriLoss) + (1 - agriShare) * (1 - otherLoss));
    const DM = B.mne_purchases * mShare * growth;
    const G = (B.gov_consumption + B.gni_star * provision) * growth;
    const I_pub = (B.public_investment + B.gni_star * investPush) * growth;
    const I_priv = B.private_investment * growth * (1 - D.private_investment_fall * phase(t, 1, D.transition_years));
    const I = I_pub + I_priv;

    // ---- multinationals' local spending (nominal, earned abroad) ---------------------------
    const W_M = B.mne_wages * mShare * growth * P_D;
    const T_M = B.mne_taxes * mShare * growth * P_D;
    const E_M = B.mne_employment * mShare;
    const windfall = t >= 1 && !exited ? T_M * D.windfall_share : 0; // pre-exit windfall CT goes to the Fund (Arts. 60, 114)

    // ---- transfers --------------------------------------------------------------------------
    const farmGuarantee = B.farm_income * herd * D.farm_guarantee_share * growth * P_D;
    const capReplacement = exited ? B.cap_eu_funding * D.cap_replacement * growth * P_D : 0;
    const TR_base = B.transfers * growth * P_D;
    const otherRev = B.other_revenue * growth * P_D; // property taxes, fees, etc., paid by households
    const TR_all = TR_base + farmGuarantee + capReplacement;

    // ---- productivity, hours, labour supply ---------------------------------------------------
    if (t > 0) {
      const publicCapital = D.public_capital_return * ((I_pub * (1 - waste)) / (B.gni_star * growth) - B.public_investment / B.gni_star);
      prodIndex *= 1 + D.productivity_growth + publicCapital;
    }
    const hours = B.hours_per_worker * (1 - hoursCut);
    const prodPerHour = prodPerHour0 * prodIndex * (1 + D.hours_offset * hoursCut);
    const labourForce = B.labour_force * Math.pow(1 + D.labour_force_growth, t);

    // ---- solve demand, with the capacity limit and the Job Guarantee (fixed point) ------------
    // Real domestic value added Y satisfies Y = k[(1−t_w)(ω P_D Ym + Wo) + TR − OR] + A, where
    // Ym = Y − JG output. Consumption outlay incl. VAT = c × after-tax labour and transfer income.
    const k = ((1 - mc) * c) / (P_C * (1 + D.t_c));
    // the extra tax is levied as a flat share of household gross income, sized to raise taxUp × GNI*
    // at the baseline income level (a stand-in for progressive income and wealth taxes)
    const grossIncome0 = (B.domestic_wages + B.mne_wages) * (1 - D.t_w) + propertyShare * (B.domestic_va - B.domestic_wages) * (1 - D.t_s);
    const tx_rate = (taxUp * B.gni_star) / grossIncome0;
    const A_exJG = (1 - mg) * G + (1 - mi) * I + (1 - mx) * X + DM;
    let E_JG = 0;
    let s;
    for (let it = 0; it < 500; it++) {
      const W_JG = E_JG * D.jg_wage * P_D; // € bn
      const JGreal = W_JG / P_D;
      const Wo = W_M + W_JG;
      // household income per unit of domestic output: after-tax wages plus the property share of
      // the after-tax surplus, both less the extra progressive tax
      const perY = ((1 - D.t_w) * omega + propertyShare * (1 - D.t_s) * (1 - omega)) * (1 - tx_rate) * P_D;
      const Ym_unc = (k * ((1 - D.t_w) * (1 - tx_rate) * Wo + TR_all - otherRev) + A_exJG) / (1 - k * perY);
      const available = Math.max(0, labourForce * (1 - D.frictional_unemployment) - E_M - E_JG);
      const capM = available * prodPerHour * hours;
      const Ym = Math.min(Ym_unc, capM);
      const E_D = Ym / (prodPerHour * hours);
      const slack = Math.max(0, labourForce * (1 - D.frictional_unemployment) - E_M - E_D - E_JG);
      const jgCap = D.jg_capacity * phase(t, 1, D.jg_build_years) * labourForce;
      const target = clamp(E_JG + slack, 0, jgCap);
      s = { W_JG, JGreal, Ym, Ym_unc, capM, E_D, E_JG };
      if (Math.abs(target - E_JG) < 1e-10) break;
      E_JG += 0.6 * (target - E_JG);
    }
    const { W_JG, JGreal, Ym, E_D } = s;
    E_JG = s.E_JG; // the solution actually used

    // ---- incomes and outlays, nominal ------------------------------------------------------------
    const W_D = omega * Ym * P_D;
    const S_D = Ym * P_D - W_D;
    const wages = W_D + W_M + W_JG;
    const propertyIncome = propertyShare * (S_D - D.t_s * S_D);
    const incomeTax = D.t_w * wages;
    const extraTax = tx_rate * ((1 - D.t_w) * wages + propertyIncome);
    const interestDomestic = rate * debtDomestic;
    const interestToHouseholds = D.domestic_debt_held_at_home * interestDomestic;
    const foreignRate = rate + (exited ? D.foreign_rate_premium : 0);
    const interestAbroad = (1 - D.domestic_debt_held_at_home) * interestDomestic + foreignRate * debtForeignFC * e;
    const outlay = c * (wages - incomeTax - extraTax + propertyIncome + TR_all - otherRev); // consumption including VAT
    const C_nom = outlay / (1 + D.t_c);
    const vat = outlay - C_nom;
    const C_real = C_nom / P_C;
    // demand for domestic output vs what was produced: the excess spills into imports
    const demandDomestic = ((1 - mc) * C_real + A_exJG) * P_D;
    const overflow = Math.max(0, demandDomestic - Ym * P_D); // excess demand met by imports, nominal
    const C_dom = (1 - mc) * C_real * P_D - overflow;
    const C_imp = C_nom - C_dom;
    const disposable = wages - incomeTax - extraTax + propertyIncome + TR_all - otherRev + interestToHouseholds;
    const H_nl = disposable - outlay;

    // producers
    const surplusTax = D.t_s * S_D;
    const socialShare = D.social_ownership_share * phase(t, 1, D.transition_years);
    const dividend = D.public_dividend_share * socialShare * (S_D - surplusTax);
    const I_priv_nom = (1 - mi) * I_priv * P_D + mi * I_priv * P_Mp;
    const otherAbroad = otherNetAbroad0 * growth * P_D; // calibrated, see calibrate()
    const P_nl = S_D - surplusTax - dividend - propertyIncome - otherAbroad - I_priv_nom;

    // the State (consolidated with the Social Wealth Fund)
    const G_nom = (1 - mg) * G * P_D + mg * G * P_Mp + W_JG;
    const I_pub_nom = (1 - mi) * I_pub * P_D + mi * I_pub * P_Mp;
    const swfIncome = D.swf_return * swfFC * e;
    const euContribution = exited ? 0 : B.eu_net_contribution * growth * P_D;
    const revenue = { incomeTax, extraTax, vat, surplusTax, mneTaxes: T_M - windfall, windfall, dividends: dividend, other: otherRev, fundIncome: swfIncome };
    const revenueTotal = Object.values(revenue).reduce((a, b) => a + b, 0);
    const spend = {
      services: G_nom - W_JG,
      jobGuarantee: W_JG,
      transfers: TR_base,
      farmGuarantee,
      capReplacement,
      interest: interestDomestic + foreignRate * debtForeignFC * e,
      investment: I_pub_nom,
      euContribution,
    };
    const spendTotal = Object.values(spend).reduce((a, b) => a + b, 0);
    const G_nl = revenueTotal - spendTotal;
    const currentBalance = G_nl + I_pub_nom; // before public investment (golden-rule view)

    // the rest of the world
    const X_nom = (1 - mx) * X * P_D + mx * X * P_Mp;
    const imports = C_imp + mg * G * P_Mp + mi * I * P_Mp + mx * X * P_Mp;
    const energyImports = mc * sc * C_real * P_E + sp * (mg * G + mi * I + mx * X) * P_E;
    const mneInflow = W_M + T_M + DM * P_D;
    const currentAccount = X_nom + mneInflow + swfIncome - imports - interestAbroad - euContribution - otherAbroad;

    // ---- financing the State: Fund (investment only, Art. 60), savers, Central Bank (Art. 61.4) --
    // moving the windfall into the Fund is an acquisition of assets: it must be financed like a deficit
    const need = -G_nl + windfall;
    const flight = t <= tx ? (S.capital_flight * B.household_deposits) / (tx + 1) : 0;
    const fundDraw = clamp(need, 0, Math.min(I_pub_nom, D.swf_draw_rule * swfFC * e)); // only for investment
    const savers = Math.max(0, H_nl + P_nl - flight) * D.domestic_absorption;
    const fromSavers = clamp(need - fundDraw, 0, savers);
    const ceiling = D.cb_ceiling * B.gni_star * growth * P_D;
    const fromCB = clamp(need - fundDraw - fromSavers, 0, ceiling);
    const gap = Math.max(0, need - fundDraw - fromSavers - fromCB);
    const surplus = Math.max(0, -need);
    const repay = Math.min(surplus, debtDomestic); // surpluses repay domestic debt first...
    const toFund = surplus - repay; // ...and anything beyond goes into the Fund

    // ---- stocks -------------------------------------------------------------------------------
    const debtBefore = debtDomestic + debtForeignFC * ePrev;
    debtDomestic = debtDomestic + fromSavers + fromCB + gap - repay;
    swfFC = swfFC + (windfall + toFund - fundDraw) / e;
    const revaluation = debtForeignFC * (e - ePrev);
    const debt = debtDomestic + debtForeignFC * e;
    deposits = Math.max(0, deposits + H_nl - flight);
    // the reserves: current account, minus capital flight, plus Fund assets sold to pay for investment,
    // minus the windfall moved into the Fund (it is invested abroad)
    // and minus any budget surplus moved into the Fund
    const reservesBefore = reservesFC * ePrev;
    const privateBefore = privateFC * ePrev;
    const fundFlow = windfall + toFund - fundDraw; // net purchases of foreign assets by the Fund
    if (exited) {
      // capital controls: export earnings are surrendered to the Central Bank
      reservesFC += (currentAccount - flight - fundFlow) / e;
      privateFC += flight / e;
    } else {
      // inside the euro: deposits moved abroad drain the Central Bank's TARGET claim one for one
      reservesFC -= flight / e;
      privateFC += (currentAccount - fundFlow + flight) / e;
    }

    // ---- inflation ------------------------------------------------------------------------------
    const demandPull = D.demand_pull * (overflow / Math.max(1e-9, Ym * P_D));
    const credibility = D.credibility_premium * (fromCB / Math.max(1e-9, B.gni_star * growth * P_D));
    const piC = t === 0 ? D.inflation_target : P_C / P_C_prev - 1 + demandPull + credibility;
    P_C_prev = P_C;
    piC_prev = piC;

    // ---- indicators ----------------------------------------------------------------------------------
    const employed = E_M + E_D + E_JG;
    const unemployment = Math.max(0, 1 - employed / labourForce);
    const essentialMonthly = (energyImports + (B.food_imports + B.medicine_imports) * growth * P_M) / 12;
    const reserves = reservesFC * e;
    const reserveMonths = reserves / Math.max(1e-9, essentialMonthly);
    const gniStar = Ym * P_D + W_JG + W_M + T_M + vat + B.gni_other * growth * P_D;
    const realWagePerWorker = wages / employed / P_C;
    const realWage0 = (B.domestic_wages + B.mne_wages) / B.employment;

    years.push({
      t,
      exited,
      prices: { P_D, P_C, P_M, P_E, e, inflation: piC },
      output: { Y_real: Ym + JGreal, valueAdded: Ym * P_D + W_JG, gniStar, overflow, capacityUse: Ym / s.capM },
      demand: { C_nom, C_dom, C_imp, G_nom, I_pub_nom, I_priv_nom, X_nom, mnePurchases: DM * P_D },
      households: { wages, propertyIncome, transfers: TR_all, interest: interestToHouseholds, incomeTax, extraTax, otherTaxes: otherRev, vat, disposable, consumption: C_nom, saving: H_nl, deposits },
      producers: { valueAdded: Ym * P_D, wages: W_D, surplus: S_D, tax: surplusTax, dividend, propertyIncome, investment: I_priv_nom, netLending: P_nl },
      mne: { share: mShare, wages: W_M, taxes: T_M, purchases: DM * P_D, employment: E_M },
      state: { revenue, revenueTotal, spending: spend, spendingTotal: spendTotal, balance: G_nl, currentBalance, financing: { need, fundDraw, fromSavers, fromCB, ceiling, gap, repay, toFund }, debt, debtBefore, revaluation, fund: swfFC * e },
      external: { exports: X_nom, mneInflow, fundIncome: swfIncome, imports, energyImports, interestAbroad, euContribution, currentAccount, otherAbroad, flight, reserves, reservesBefore, privateForeign: privateFC * e, privateBefore, fundFlow, reserveMonths },
      employment: { labourForce, mne: E_M, domestic: E_D, jobGuarantee: E_JG, employed, unemployment },
      indicators: { realWage: realWagePerWorker / realWage0, debtToGni: debt / gniStar, balanceToGni: G_nl / gniStar, caToGni: currentAccount / gniStar },
      check: { H_nl, P_nl, G_nl, CA: currentAccount },
    });

    // ---- where it breaks ----------------------------------------------------------------------
    if (gap > K.budget_gap * gniStar) breaks.push({ t, kind: 'budget', label: 'Budget: the deficit is larger than savers and the Central Bank ceiling can finance' });
    if (exited && reserveMonths < K.reserve_months) breaks.push({ t, kind: 'external', label: `External: reserves cover less than ${K.reserve_months} months of essential imports` });
    if (t > 0 && spend.interest / revenueTotal > K.interest_share) breaks.push({ t, kind: 'budget', label: `Budget: interest takes more than ${Math.round(K.interest_share * 100)}% of revenue` });
    if (piC > K.inflation) breaks.push({ t, kind: 'inflation', label: `Inflation above ${Math.round(K.inflation * 100)}%` });
    if (unemployment > K.unemployment) breaks.push({ t, kind: 'employment', label: `Unemployment above ${Math.round(K.unemployment * 100)}%, even with the Job Guarantee` });
  }
  return { years, breaks, calibration: cal, sliders: S };
}

/** First year each kind of break appears, or null. */
export function firstBreaks(result) {
  const out = {};
  for (const b of result.breaks) if (!(b.kind in out)) out[b.kind] = b;
  return out;
}

/**
 * The tipping point for one slider: the largest value (searching from its minimum) at which nothing
 * breaks up to `years`, with every other slider held where it is. Returns null if even the minimum
 * breaks, or the maximum if nothing breaks anywhere in the range. Assumes breaks get worse as the
 * slider moves towards its maximum (true for every slider in the parameter file except participation,
 * for which the search runs the other way).
 */
export function tippingPoint(params, sliders, key, years = values(params.design).transition_years) {
  const s = params.sliders[key];
  const S = { ...defaultSliders(params), ...sliders };
  const worseUp = !s.better_when_higher;
  const ok = (v) => !run(params, { ...S, [key]: v }, { years }).breaks.length;
  let good = worseUp ? s.min : s.max;
  let bad = worseUp ? s.max : s.min;
  if (!ok(good)) return null;
  if (ok(bad)) return bad;
  for (let i = 0; i < 30; i++) {
    const mid = (good + bad) / 2;
    if (ok(mid)) good = mid;
    else bad = mid;
  }
  return good;
}
