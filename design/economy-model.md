# The economy model: specification

This is the specification of the model behind the Economy section. The code is `src/lib/economy-model.js`; every number it uses is in [`economy-params.json`](economy-params.json); the research behind them is [`research/12-economy.md`](../research/12-economy.md) and [`research/13-leaving-the-eu.md`](../research/13-leaving-the-eu.md). The unit tests that check the accounts are `tests/economy.mjs`.

**It is an illustrative model, not a forecast.** It exists to show how the republic's accounts fit together, which way each pressure pushes them, and roughly where they break. Its behavioural relationships are deliberately simple, and many of its parameters are the drafter's judgement, each labelled as such.

## 1. What it must answer

How the republic stays afloat, year by year from the start of the transition (year 0 = Ireland in 2025) to year 20:

- **the State's budget**: what it raises, what it spends, how any deficit is financed, and the debt that results;
- **the external balance**: what the domestic economy earns in foreign currency and what it must pay for, and the reserves that are left;
- **prices**: inflation, above all from a falling currency;
- **work**: employment, the Job Guarantee, and unemployment.

## 2. Rules the model keeps

1. **No numbers made to work by assumption.** Nothing in the model is a "plug" that silently closes a gap. Where a gap cannot be financed, the model says so: it records an *unfinanced gap* and marks the budget as broken. Three coefficients are **calibrated** so that year 0 reproduces 2025; they are listed in section 6 and shown on the site.
2. **Every flow has a payer and a payee.** So the accounts close by construction, and the tests check that they do (section 7).
3. **GNI\*, not GDP.** The multinationals are part of the rest of the world in the model; what reaches the domestic economy from them is what they spend here (research 12 §1, §7.3).
4. **Beyond a break, the model's results are not meaningful.** In reality the economy would adjust: imports rationed, the currency falling further, spending cut. The model does not simulate that adjustment. The site greys out the years after the first break.

## 3. Structure

### 3.1 Sectors

| Sector | In the model | Pays | Receives |
|---|---|---|---|
| **Households (H)** | All residents as earners and consumers | Consumption (incl. VAT and excise), taxes on income, other taxes and fees | Wages, a share of enterprise surplus (self-employment, rents, dividends), transfers, interest on public debt held at home |
| **Domestic producers (P)** | Public, municipal and co-operative enterprise, small private firms, and public services as producers | Wages, taxes on surplus, dividends to the State, property income to households, net payments abroad not otherwise modelled, investment | Sales to households, the State, investors, exporters and multinationals |
| **The State (G)** | General government consolidated with the Social Wealth Fund | Public services, transfers, Job Guarantee wages, farm income guarantee, replacement of EU farm payments, interest, public investment, EU contribution (before exit) | All taxes, dividends from social enterprise, the Fund's income |
| **Rest of the world (X)** | Includes foreign multinationals | Exports bought; multinationals' local wages, taxes and purchases; the Fund's income | Imports; interest abroad; the EU contribution |

### 3.2 Time and phasing

Years 0–20. Year 0 is Ireland in 2025 with no change of policy. Notice to leave the EU is given at the start of year 1 and the republic leaves at the start of **year 2** (Art. 50's default). The design's programmes (public provision, investment, extra tax, the Job Guarantee, social ownership) phase in from year 1. Shocks (multinationals leaving, the herd, working hours) phase in over the years set in the parameter file.

### 3.3 Equations, year t

Prices. The punt's exchange rate is `e = 1/(1 − devaluation)` from exit day. Import prices are `P_M = e × (1 + π*)^t`; energy import prices also carry the energy-price slider. Domestic output prices rise by `π_D = target + indexation × (last year's consumer inflation − target)`. The consumer price index is a weighted mix: `P_C = (1 − m_c) P_D + m_c × (import price)`, so **pass-through from the currency to consumer prices equals the import share of consumption**. That is about 19% at baseline, inside the IMF and BIS ranges (research 12 §7.1).

Imports respond to their relative price: each import propensity is multiplied by `(import price / domestic price)^−import_elasticity`, and the energy part of imports shrinks as domestic renewables replace it.

Demand. Real final demand is consumption `C`, public services `G`, investment `I` (public and private), Irish-owned exports `X` and multinationals' purchases `DM`. Each has an import content (`m_c`, `m_g`, `m_i`, `m_x`); the rest is domestic value added:

```
Y = (1 − m_c) C + (1 − m_g) G + (1 − m_i) I + (1 − m_x) X + DM          (real, domestic output)
C × P_C × (1 + t_c) = c × [after-tax wages + property income + transfers − other taxes]
```

Because consumption depends on incomes, which depend on output, the two lines are solved together each year: a Keynesian multiplier with leakages into tax, saving and imports.

Capacity. Output cannot exceed what the available workforce can produce: `(labour force × (1 − frictional) − multinational jobs − Job Guarantee jobs) × output per hour × hours`. Demand beyond capacity spills into imports and adds to inflation (`demand_pull`).

The Job Guarantee (Art. 76). It takes up the unemployed above the frictional rate, up to its capacity, which builds up over three years. Its wages are public spending and its output is public service.

Exports. Irish-owned exports grow with the trend, respond to a cheaper punt (`export_elasticity`), and lose a share on worse trade terms (`wto_loss_agrifood`, `wto_loss_other`) and with a smaller herd (`herd_export_share`).

Multinationals. A share leaves (slider), phased over three years. Their wages, corporation tax, purchases and jobs fall in proportion. Indirect jobs are **not** assumed: they follow from the fall in purchases and wages through the demand system.

The State. Revenue: tax on labour income `t_w`, consumption taxes `t_c`, tax on domestic surplus `t_s`, the multinationals' corporation tax, the extra progressive tax (`tax_increase`), dividends from social enterprise, other revenue, and the Fund's income. Before exit, the windfall share of the multinationals' tax is moved into the Fund (Arts. 60, 114). Spending: services, the Job Guarantee, transfers, the farm income guarantee (Art. 67), replacement of EU farm payments after exit, interest, public investment, and the EU contribution before exit.

Financing (Arts. 60, 61.4). The State's borrowing need is the deficit plus any money moved into the Fund. It is met in this order:
1. **the Fund**, for public investment only, up to `swf_draw_rule` of its value a year;
2. **savers**: a share (`domestic_absorption`) of households' and producers' net lending;
3. **the Central Bank**, up to the ceiling the Assembly votes (`cb_ceiling` × GNI\*), with an inflation penalty (`credibility_premium`);
4. anything left is an **unfinanced gap**, and the budget breaks.

Surpluses repay domestic debt, and any excess goes into the Fund.

The external accounts. The current account is exports, plus multinationals' local spending, plus the Fund's income, less imports, interest paid abroad, the EU contribution and other net payments abroad. **Before exit** the surplus builds up as private foreign assets, and deposits moved abroad drain the Central Bank's TARGET claim. **After exit**, under capital controls, export earnings are surrendered to the Central Bank, so the current account changes the reserves directly. Debt under foreign law stays in euro and grows in punts when the punt falls (research 12 §8.5).

## 4. Where it breaks

| Break | Test (thresholds in the parameter file) |
|---|---|
| **Budget** | An unfinanced gap above 0.5% of GNI\*, or interest above 15% of revenue |
| **External balance** | After exit, reserves cover less than three months of essential imports (energy, food, medicines) |
| **Inflation** | Consumer inflation above 10% |
| **Employment** | Unemployment above 8% even with the Job Guarantee |

The site also shows each slider's **tipping point**: the furthest it can move, with the other sliders where they are, before anything breaks in the first ten years.

## 5. The sliders

Eight uncertainties, each with its range and the source for that range in the parameter file: the share of multinationals that leave; capital flight during the notice period; the fall of the punt; trade terms with the EU and UK; the pace of herd reduction; the cut in working hours; world energy prices; and participation in planning bodies.

## 6. Calibration

These are set by the model, not by hand, so that year 0 reproduces 2025. The site shows their values.

| Coefficient | Set so that… | Value at the current parameters |
|---|---|---|
| `m_c`, import share of household consumption | domestic value added matches the baseline | about 19% |
| `c`, share of household income spent | household consumption matches the national accounts | about 0.82 |
| `propertyShare`, share of the after-tax domestic surplus paid to households | household disposable income matches €188.7bn | about 0.47 |
| `otherNetAbroad0`, other net payments abroad | the current account matches the CSO's modified current account (CA\*), €24.3bn | about €23bn |
| `sigma_c`, `sigma_p`, energy shares of imports | the energy import bill matches €7.49bn | — |

The last calibrated item is large. It stands for flows the model does not separate: residents' spending on travel abroad (€11.0bn in 2025), domestic firms' imports of services, and other income. That is a known weakness.

## 7. The accounting identities (tested)

`tests/economy.mjs` runs the model at every slider's minimum, default and maximum, at every pair of slider extremes, and at 300 random positions: 429 runs, over 64,000 checks. In every year of every run it checks:

1. **Sectoral balances:** households + producers + State net lending = the current account.
2. **Expenditure:** domestic value added = consumption + public spending + investment + exports + multinationals' purchases − imports.
3. **The budget closes:** revenue − spending = the balance, and the borrowing need = Fund + savers + Central Bank + unfinanced gap (or, in surplus, repayment + saving into the Fund).
4. **Households' budget:** disposable income = consumption outlay + saving.
5. **Debt stock-flow:** debt = last year's debt + borrowing + revaluation of euro debt.
6. **Balance of payments:** the current account = the change in reserves + private foreign assets + the Fund's foreign assets.
7. **Calibration:** year 0 reproduces domestic value added, consumption, GNI\*, household disposable income and CA\*.

## 8. Known weaknesses

- The household and enterprise sectors are single aggregates. There is no distribution of income within them.
- Prices are set by a simple indexation rule, not by bargaining; real wages are an output, not a policy.
- Behavioural parameters (export and import elasticities, the hours offset, investment waste) are judgement calls; the participation link is the weakest.
- The model does not simulate what happens after a break (rationing, further devaluation, default).
- Ageing (research 12 §3.5) is not modelled beyond trend growth in transfers.

## 9. Every parameter

The table below is generated from `economy-params.json` by `node scripts/economy/params-table.mjs`. Do not edit it by hand.

<!-- params-table:start -->

### Baseline: Ireland in 2025

| Parameter | Value | Unit | Kind | Source |
|---|---|---|---|---|
| `gni_star` GNI* | 333.97 | € bn | Data | CSO NA001, 2025 (research 12 §1) |
| `household_consumption` Household consumption, excluding VAT and excise | 125.02 | € bn | Derived | CSO ISQ01 individual consumption €154.42bn (2025) less VAT €22.94bn and excise €6.47bn (EFO Table 11); research 12 §2.3, §3.1 |
| `household_energy_imports` Imported energy bought directly by households | 2.25 | € bn | **Assumption** | About 30% of the €7.49bn energy import bill (CSO TSA06 2025): residential oil, gas and coal plus private road fuel, from the shares of final consumption in SEAI's 2024 energy balance (research 12 §6.1). The 30% split is the drafter's estimate |
| `energy_imports` Energy imports (SITC 3) | 7.49 | € bn | Data | CSO TSA06, 2025 (research 12 §4.1) |
| `food_imports` Food, drink and tobacco imports (SITC 0, 1) | 12.85 | € bn | Data | CSO TSA06, 2025 (research 12 §4.2) |
| `medicine_imports` Medicines for domestic use paid in foreign currency | 3 | € bn | **Assumption** | The State's medicines bill, 'almost €3 billion' (Department of Health projection for 2024, research 12 §4.3). Treating all of it as imported is an assumption |
| `gov_consumption` Public services: pay plus goods and services | 57.48 | € bn | Data | CSO GFA01 2025: compensation of employees €36.14bn + use of goods and services €21.34bn |
| `public_investment` Public investment (gross) | 17.28 | € bn | Derived | CSO GFA01 2025: net acquisition of non-financial assets €9.52bn + depreciation €7.76bn |
| `private_investment` Private investment (modified) | 55.92 | € bn | Derived | Modified GFCF €73.20bn (CSO NAQ05, 2025) less public investment €17.28bn |
| `transfers` Social and other transfers, subsidies | 55.31 | € bn | Derived | CSO GFA01 2025: social benefits €43.39bn + other current transfers €4.11bn + subsidies €3.55bn + capital transfers €5.06bn, less the net EU contribution below |
| `eu_net_contribution` Net contribution to the EU budget | 0.8 | € bn | Data | About €800m in 2024 (MEP's estimate; no official figure found; research 13 §5) |
| `interest` Interest on public debt | 2.97 | € bn | Data | CSO GFA01 2025 |
| `other_revenue` Other revenue (capital taxes, property, fees, sales, investment income, one-offs) | 21.53 | € bn | Derived | General government revenue €145.05bn (CSO GFA01 2025) less labour taxes, consumption taxes and corporation tax as defined here |
| `domestic_exports` Exports of Irish-owned firms | 45.86 | € bn | Derived | Enterprise Ireland client exports €38.86bn (2025) + tourism receipts €7.0bn (CSO BPA19); research 12 §2.4. The CSO's wider figure for domestic firms' services exports (€73bn, 2023) is not used; see the economy-model spec |
| `agrifood_exports` Food, drink and horticulture exports | 19 | € bn | Data | Bord Bia, 2025 (research 13 §4.1) |
| `mne_wages` Multinationals' payroll in Ireland | 26 | € bn | Data | ABSEI 2024 (research 12 §7.3) |
| `mne_purchases` Multinationals' purchases of Irish services and materials | 17.3 | € bn | Data | ABSEI 2024: services €12.2bn + materials €5.1bn |
| `mne_taxes` Corporation tax paid by foreign-owned multinationals | 28.8 | € bn | Data | Revenue, CT 2025 (research 12 §3.2) |
| `mne_employment` Employment in foreign-owned agency client firms | 325.3 | thousand | Data | Annual Employment Survey 2025 (research 12 §2.2) |
| `domestic_wages` Wages in the domestic economy | 139.16 | € bn | Derived | Compensation of employees €165.16bn (CSO NAQ08 2025) less multinationals' payroll €26.0bn |
| `domestic_va` Value added of the domestic economy | 249.77 | € bn | Derived | GNI* less multinationals' payroll and corporation tax, less VAT and excise (which the model records as household taxes): 333.97 − 26.0 − 28.8 − 29.41 |
| `gni_other` Other items in GNI* not modelled | 0 | € bn | Derived | Zero by construction: domestic value added is defined as the remainder |
| `employment` Employment | 2817.6 | thousand | Data | CSO QLF03, 2025 average |
| `labour_force` Labour force | 2965.9 | thousand | Derived | Employment ÷ (1 − 5.0% unemployment; CSO ALF03 2025) |
| `hours_per_worker` Average hours per worker (index, today = 1) | 1 | index | **Assumption** | An index, so no figure is needed |
| `public_debt` Gross general government debt | 209.9 | € bn | Data | CSO, end-2025 (research 12 §3.4) |
| `state_funds` State funds: Future Ireland Fund, ICNF, ISIF | 32.9 | € bn | Derived | NTMA, end-2025: €12.7bn + €4.1bn + €16.1bn (research 12 §3.3) |
| `fx_reserves` Existing official reserves usable on exit day | 0 | € bn | **Assumption** | Not sourced (the ECB data portal could not be reached). Set to zero so that only the TARGET settlement counts: a deliberately cautious assumption |
| `target_claim` Central Bank's TARGET claim on the Eurosystem | 81.8 | € bn | Data | ECB data, end-August 2026 (research 13 §2.1) |
| `household_deposits` Household deposits in Irish banks | 160 | € bn | **Assumption** | Not sourced in this pass; an order-of-magnitude figure used only to size capital flight. Owner should replace with the Central Bank's money and banking statistics |
| `farm_income` Value added of agriculture, forestry and fishing | 7.26 | € bn | Data | CSO NA016, 2025 (research 12 §2.1); used as the farm income the Art. 67 guarantee protects |
| `cap_eu_funding` EU-funded CAP payments | 1.5 | € bn a year | Derived | Nearly €7.5bn from the EU budget over 2023–27 (European Commission; research 13 §5) ÷ 5 |
| `household_disposable_income` Household gross disposable income | 188.69 | € bn | Data | CSO ISQ01, 2025 (research 12 §2.3); used to calibrate the share of the domestic surplus households receive |
| `ca_star` Modified current account (CA*) | 24.3 | € bn | Data | CSO BPA39, 2025 (research 12 §2.4); the model is calibrated to it |

### Design and behaviour

| Parameter | Value | Unit | Kind | Source |
|---|---|---|---|---|
| `horizon` Years modelled | 20 | years | **Assumption** | Transition (years 0–10) plus ten years to a long-run position |
| `exit_year` Year the republic leaves the EU and the euro | 2 | year | Data | Article 50's two-year default (Art. 104.1; research 13 §1.5) |
| `transition_years` Years over which the transition is phased | 10 | years | **Assumption** | The owner's brief (transition years 0–10) |
| `provision_years` Years to build up public provision | 5 | years | **Assumption** | Drafter's assumption |
| `trend_growth` Underlying real growth of the domestic economy | 0.015 | per year | **Assumption** | Drafter's assumption, below the 2.2% real growth of non-multinational sectors in 2025 (research 12 §2.1) to allow for the shocks of the transition |
| `labour_force_growth` Growth of the labour force | 0.005 | per year | **Assumption** | Drafter's assumption (ageing slows labour-force growth; research 12 §3.5) |
| `productivity_growth` Underlying productivity growth | 0.01 | per year | Derived | Trend growth less labour-force growth, so that unemployment is stable with no shocks |
| `inflation_target` Central Bank inflation target | 0.02 | per year | **Assumption** | Set by the Assembly under Art. 61.2; 2% is the drafter's placeholder |
| `foreign_inflation` Inflation abroad | 0.02 | per year | **Assumption** | Drafter's assumption |
| `indexation` Share of last year's inflation passed into this year's wages and domestic prices | 0.6 | share | **Assumption** | Drafter's assumption: partial indexation, so a currency shock raises prices for several years without spiralling |
| `export_elasticity` Response of export volumes to a cheaper currency | 0.5 | elasticity | **Assumption** | Drafter's assumption, at the low end of trade-elasticity estimates; Irish-owned exports are heavily food, whose markets are constrained by tariffs and quotas |
| `wto_loss_agrifood` Fall in agri-food exports on WTO terms with both the EU and the UK | 0.27 | share | Derived | Copenhagen Economics' WTO scenario: beef exports −35%, dairy −40% (research 13 §4.2), applied to the 72% of agri-food exports sold to the EU and UK |
| `wto_loss_other` Fall in other Irish-owned exports on WTO terms | 0.077 | share | Data | Copenhagen Economics: exports 7.7% below baseline by 2030 in the WTO scenario (research 13 §4.2). An analogy from Brexit, not a forecast |
| `herd_export_share` Beef and dairy share of agri-food exports | 0.56 | share | Derived | (€3.4bn beef + €7.3bn dairy) ÷ €19bn, Bord Bia 2025 (research 13 §4.1). Exports are assumed to fall in proportion to the herd |
| `farm_guarantee_share` Share of lost farm income replaced | 1 | share | Data | Art. 67.2: income no lower than the previous five-year average |
| `cap_replacement` Share of EU farm payments the State replaces after exit | 1 | share | **Assumption** | Drafter's assumption: the republic keeps farm support whole |
| `provision_expansion` Extra public provision: childcare, the Care Service, transport, the energy allowance | 0.03 | share of GNI* | **Assumption** | Drafter's assumption for Arts. 21, 24, 68, 71; to be costed item by item |
| `public_investment_push` Extra public investment: housing, retrofits, grid, rail | 0.02 | share of GNI* | **Assumption** | Drafter's assumption |
| `private_investment_fall` Fall in private investment over the transition | 0.3 | share | **Assumption** | Drafter's assumption: conversion to social ownership (Art. 47.2) and uncertainty; Przeworski and Wallerstein find investment falls while redistribution is anticipated (research 12 §8.1) |
| `public_capital_return` Productivity gain from extra productive public investment | 0.1 | elasticity | **Assumption** | Drafter's assumption, in the range commonly reported for the output elasticity of public capital; not separately sourced in this pass |
| `investment_waste_max` Share of public investment wasted when no one takes part in planning | 0.3 | share | **Assumption** | Drafter's assumption representing Kornai's 'investment hunger' (research 12 §8.4). Waste falls in proportion to participation. The weakest-evidenced link in the model |
| `hours_offset` Share of an hours cut recovered by higher output per hour | 0.5 | share | **Assumption** | Drafter's assumption; four-day-week trials report output largely maintained, but they are small and self-selected |
| `energy_import_cut` Share of imported energy replaced by domestic renewables by year 10 | 0.4 | share | **Assumption** | Drafter's assumption; 64.9% of indigenous energy was already renewable in 2025 and imports are 92.8% fossil (research 12 §4.1) |
| `jg_wage` Job Guarantee wage (about €30,000 a year) | 0.03 | € bn per thousand people a year | **Assumption** | Drafter's assumption, near a full-time living wage |
| `jg_capacity` Most the Job Guarantee can absorb | 0.06 | share of labour force | **Assumption** | Drafter's assumption: organisational capacity, built up over the first years |
| `jg_build_years` Years to build the Job Guarantee to capacity | 3 | years | **Assumption** | Drafter's assumption |
| `frictional_unemployment` Unemployment between jobs | 0.03 | share | **Assumption** | Drafter's assumption |
| `t_w` Tax and PRSI on labour income | 0.3705 | rate | Derived | (Income tax incl. USC €36.58bn + social contributions €24.61bn) ÷ compensation of employees €165.16bn, 2025 |
| `t_c` VAT and excise on consumption | 0.2352 | rate | Derived | (VAT €22.94bn + excise €6.47bn) ÷ consumption excluding them €125.02bn |
| `t_s` Tax on the domestic surplus | 0.0371 | rate | Derived | Domestic corporation tax (€32.9bn underlying less €28.8bn paid by foreign multinationals) ÷ domestic operating surplus (€249.77bn − €139.16bn) |
| `m_g` Import content of public services | 0.1 | share | **Assumption** | Drafter's assumption: mostly wages |
| `m_i` Import content of investment | 0.35 | share | **Assumption** | Drafter's assumption: machinery (€17.1bn of modified investment) is mostly imported, construction (€43bn) mostly domestic (research 12 §2.5) |
| `m_x` Import content of Irish-owned exports | 0.3 | share | **Assumption** | Drafter's assumption: feed, fertiliser and fuel in food exports (research 12 §4.2) |
| `social_ownership_share` Share of the domestic surplus earned by socially owned enterprise by year 10 | 0.5 | share | **Assumption** | Drafter's assumption for Art. 47 (public, municipal and co-operative) |
| `public_dividend_share` Share of socially owned enterprises' after-tax surplus paid to the State | 0.2 | share | **Assumption** | Drafter's assumption; co-operative reserves are indivisible (Art. 50.3), so most surplus is reinvested |
| `interest_rate` Effective interest rate on public debt today | 0.0142 | rate | Derived | Interest €2.97bn ÷ debt €209.9bn, 2025 (CSO); the EFO gives 1.4% |
| `foreign_law_debt_share` Share of public debt under foreign law, which stays in euro | 0.2 | share | **Assumption** | Unverified: new bonds are under Irish law, some older programmes under English law (research 13 §2.1). 20% is the drafter's placeholder |
| `domestic_debt_held_at_home` Share of domestic-law debt held by residents | 0.5 | share | **Assumption** | Drafter's assumption; interest on the rest is paid abroad |
| `domestic_absorption` Share of private net saving that savers will lend to the State | 0.8 | share | **Assumption** | Drafter's assumption; under capital controls Iceland's trapped savings financed the budget (research 12 §7.4) |
| `cb_ceiling` Ceiling on Central Bank lending to the State | 0.03 | share of GNI* | **Assumption** | Voted each year under Art. 61.4; 3% is the drafter's placeholder |
| `credibility_premium` Extra inflation from Central Bank financing | 0.5 | inflation points per point of GNI* | **Assumption** | Drafter's assumption representing the critics' expectations channel (Mankiw, Blanchard, IMF staff; research 12 §8.3). Set to 0 for the pure MMT view |
| `demand_pull` Inflation from demand beyond capacity | 0.5 | coefficient | **Assumption** | Drafter's assumption |
| `swf_return` Return on the Social Wealth Fund | 0.04 | rate | **Assumption** | Drafter's assumption, close to Norway's 3% expected real return plus inflation (research 12 §8.2) |
| `swf_draw_rule` Most of the Fund that may be spent on investment in a year | 0.04 | share a year | **Assumption** | Drafter's assumption, after the Future Ireland Fund's 3% cap (research 12 §3.3) |
| `windfall_share` Share of multinational corporation tax that is windfall | 0.58 | share | Derived | €16.8bn 'potentially transitory' ÷ €28.8bn (Department of Finance; research 12 §3.2). Ring-fenced in the Fund before exit (Art. 60) |
| `target_settled` Share of the TARGET claim settled in foreign currency on exit | 0.5 | share | **Assumption** | No precedent; drafter's placeholder (research 13 §2.1) |
| `mne_departure_start` Year multinationals start to leave | 1 | year | **Assumption** | Drafter's assumption: once notice is given |
| `mne_departure_years` Years over which they leave | 3 | years | **Assumption** | Drafter's assumption |
| `deposit_rate` Interest on household deposits (not modelled) | 0 | rate | **Assumption** | Interest reaches households through domestic holdings of public debt instead |
| `interest_rate_rise` Rise in the effective interest rate over the transition | 0.015 | rate | **Assumption** | The Department of Finance projects 2.7% by 2030 inside the euro (EFO); a new currency and capital controls are assumed to add a little more. Drafter's assumption |
| `foreign_rate_premium` Extra interest on debt that stays in euro | 0.01 | rate | **Assumption** | Drafter's assumption: a risk premium once the State has redenominated its own-law debt |
| `tax_increase` Extra progressive income and wealth tax, phased in over five years | 0.05 | share of GNI* | **Assumption** | Drafter's assumption. Tax is already about 39% of GNI* (research 12 §8.1); this takes it towards Danish levels. Set to 0 to see the design without new taxes |
| `import_elasticity` Response of import volumes to dearer imports | 0.5 | elasticity | **Assumption** | Drafter's assumption at the low end of usual estimates: Ireland's essential imports (energy, food inputs, medicines) are hard to substitute in the short run |

### Break thresholds

| Parameter | Value | Unit | Kind | Source |
|---|---|---|---|---|
| `budget_gap` Unfinanced deficit that counts as a break | 0.005 | share of GNI* | **Assumption** | Any gap above 0.5% of GNI* after savers and the Central Bank ceiling |
| `reserve_months` Reserves below this many months of essential imports | 3 | months | **Assumption** | The traditional three-months-of-imports rule of thumb for reserve adequacy, applied here to essential imports only (energy, food, medicines) |
| `inflation` Inflation counted as a break | 0.1 | per year | **Assumption** | Drafter's threshold; Chile's inflation passed 260% in 1972 (research 12 §7.4), Iceland's peaked at 18.6% |
| `unemployment` Unemployment counted as a break | 0.08 | share | **Assumption** | Drafter's threshold, above the 5.0% of 2025 |
| `interest_share` Interest taking more than this share of revenue | 0.15 | share of revenue | **Assumption** | Drafter's threshold; interest was 2.0% of revenue in 2025 (NTMA) |

### Sliders

| Slider | Range | Default | Failure modes | Source for the range |
|---|---|---|---|---|
| `mne_exit` Share of multinationals that leave | 0 to 1 | 0.5 | FM-11 | No forecast exists. Leaving the EU removes their main reason to be here; the charter regime (Art. 52) is meant to keep some. Full range shown (research 12 §7.3) |
| `capital_flight` Deposits that leave during the notice period | 0 to 0.3 | 0.1 | FM-11, FM-10 | Greek deposits fell about 23% in a few months of 2015 (research 12 §7.4) |
| `devaluation` Fall of the punt on exit day | 0 to 0.5 | 0.25 | FM-11, FM-17 | Sterling −15% (1992); Nomura's Irish break-up estimate about −30% (2011); Iceland's króna −50% or more (2008) (research 13 §2.3) |
| `trade_terms` Trade terms with the EU and UK (0 = tariff-free deals, 1 = WTO terms with both) | 0 to 1 | 0.5 | FM-11, FM-14 | The UK–EU agreement (zero tariffs) at one end; EU and UK most-favoured-nation tariffs at the other (research 13 §4.2–4.3) |
| `herd_reduction` Reduction in the herd by year 10 | 0 to 0.6 | 0.3 | FM-16, FM-14 | From no change to a 60% reduction; agriculture is 38.7% of emissions with 6.9 million cattle (research 12 §4.2, §6.2) |
| `hours_reduction` Cut in average working hours by year 10 | 0 to 0.2 | 0.1 | FM-17, FM-18 | From no change to a four-day week (−20%) |
| `energy_price` Change in world energy prices | -0.3 to 1.1 | 0 | FM-11, FM-16 | Ireland's energy import bill rose from €6.2bn in 2021 to €13.1bn in 2022 (CSO TSA06), +111% |
| `participation` Share of residents who take part in local assemblies and planning | 0.05 to 0.6 | 0.2 | FM-08, FM-06, FM-01 | From marginal involvement to mass participation. Kerala devolved 35–40% of its plan budget to village assemblies; Porto Alegre's budget was later starved (research 06 §5, §9). The effect on investment waste is the drafter's assumption |

<!-- params-table:end -->
