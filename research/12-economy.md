# 12 — The economy: baseline, constraints and how it is financed

Research for the Economy section (October 2026). Its central question is **how the republic stays afloat**: how it pays for public provision at home and for energy, food and medicines from abroad, outside the EU, with its own currency, and with a smaller multinational sector. Every figure links to its source. "UNVERIFIED" marks figures that could not be checked against a primary or close source. Sums or ratios that are ours rather than the source's are marked *(our calculation)*. The model built on this note is specified in [`design/economy-model.md`](../design/economy-model.md); its parameters live in `design/economy-params.json`.

*Sections are added in the order the research was completed. Section numbers are fixed.*

## 1. Measuring the Irish economy: why GNI*

All CSO national-accounts figures are for 2025 (preliminary, published 2 July 2026), € million at current prices, from the PxStat tables named.

**GDP overstates the Irish economy by almost half.** The CSO bridge from GDP to GNI* for 2025 (**NA001**):

| | € million |
|---|---|
| Gross domestic product | 602,441 |
| Net factor income paid abroad | −173,001 |
| Gross national product | 429,440 |
| EU subsidies less EU taxes | +572 |
| Gross national income | 430,012 |
| less factor income of redomiciled companies | −16,288 |
| less depreciation on R&D service imports and trade in intellectual property | −69,410 |
| less depreciation on leased aircraft | −10,343 |
| **Modified gross national income (GNI*)** | **333,971** |

GNI* is 55.4% of GDP. Per person it was about **€61,200** in 2025 *(our calculation, with the April 2025 population of 5,458,600 from CSO PEA01)*.

- **Definition.** *"Modified Gross National Income at market prices (GNI*) … is equal to Gross National Income at market prices less the factor income of redomiciled companies, … less depreciation on R&D service imports and trade in IP and less depreciation on aircraft related to aircraft leasing"* ([CSO, *Annual National Accounts 2025*, background notes](https://www.cso.ie/en/releasesandpublications/ep/p-ana/annualnationalaccounts2025/backgroundnotesandmethodology/)).
- **Why it is used.** GNI* *"is designed to exclude globalisation effects that are disproportionally impacting the measurement of the size of the Irish economy"*, as *"recommended by the Economic Statistics Review Group"* ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-ana/annualnationalaccounts2025/gniandde-globalisedresults/)). The Central Bank described it as giving *"a more accurate picture of Ireland's international balance sheet"* ([Central Bank *Quarterly Bulletin* 2/2017, Box B](https://edit.centralbank.ie/docs/default-source/publications/quarterly-bulletins/quarterly-bulletin-no-2-2017.pdf)). The Department of Finance and the Fiscal Council express their targets as shares of GNI* (section 3).
- **Why it matters here.** Most of what multinationals "produce" in Ireland is profit booked here and paid out abroad: €173 billion of net factor income left the country in 2025, of which €189 billion was dividends and distributed branch profits paid abroad (CSO **BPA20**). **If multinationals leave, GDP falls enormously, but GNI* falls by much less**: by what they actually spend here on wages, taxes and Irish suppliers. The model is therefore built on GNI*, and treats the multinationals by their local spending (section 7).
- **Modified domestic demand** was about **€300.9 billion** in 2025 (*our sum* of the four quarters of modified final domestic demand in **NAQ05**).

## 2. The structure of the economy today

### 2.1 Two economies in one

- **Gross value added by sector, 2025** (**NA016**, total €571.1 billion): manufacturing 31.0%; information and communication 22.4%; administrative and support 6.2%; wholesale and retail 6.0%; real estate 5.7%; finance and insurance 3.8%; construction 2.8%; public administration 2.5%; education 2.3%; transport 2.0%; accommodation and food 1.6%; **agriculture, forestry and fishing 1.3%**. Health was €19.8 billion and social work €7.6 billion.
- **The CSO's own split** (**NA018**): sectors dominated by foreign-owned multinationals (those where *"MNE turnover on average exceeds 85% of the sector total"*: chemicals and pharmaceuticals, computers and electronics, medical devices, publishing, telecoms, programming and information services) produced **€282.5 billion (49.3%)** of gross value added; all other sectors **€291.0 billion (50.7%)**. In real terms the multinational sectors grew 14.5% in 2025 and the rest 2.2% ([CSO, GVA by activity](https://www.cso.ie/en/releasesandpublications/ep/p-ana/annualnationalaccounts2025/gdpbyincomes/grossvalueaddedbyactivity/)).
- **Ownership across the business economy (2023, CSO BIIESA32):** foreign-controlled enterprises employed **639,739** of 2.35 million people in the business economy (27.3%), and produced **€318.6 billion of €446.7 billion of value added (71.3%)** *(shares our calculation)*.

### 2.2 Work

- **Employment averaged 2,817,600 in 2025** (**QLF03**): health and social work 385,200; industry 347,000; wholesale and retail 323,700; education 246,900; professional and technical 199,900; accommodation and food 185,500; construction 184,300; information and communication 180,100; public administration 147,400; finance and real estate 146,800; transport 126,300; other services 122,200; **agriculture 108,800**; administrative and support 105,700. In Q2 2026 it was 2,839,300 (**QLF55**).
- **Foreign-owned agency client firms employed 325,288 people in 2025**, and Irish-owned client firms 229,320; together *"20% of total employment"* ([Department of Enterprise, *Annual Employment Survey 2025*](https://www.enterprise.gov.ie/en/publications/publication-files/annual-employment-survey-2025-headline-results.pdf)). IDA Ireland's own figure of 312,468 clients' employees could not be fetched directly (UNVERIFIED by direct fetch).
- **Unemployment** was 5.0% in 2025 (**ALF03**) and 5.0% in September 2026 (**MUM01**). **Median annual earnings were €46,305** in 2025, mean €58,127 (**NEA05**).

### 2.3 Households

2025 (**ISQ01**, **ISQ04**, households including non-profit institutions): gross disposable income **€188.7 billion**; individual consumption **€154.4 billion**; saving €38.4 billion, a saving ratio of about **19.9%** *(our calculation)*. **Compensation of employees** across the economy was **€165.2 billion** (**NAQ08**), of which public administration, education and health paid €45.8 billion.

### 2.4 Trade and the balance of payments

- **The current account surplus was €48.3 billion; the CSO's modified current account (CA*) was €24.3 billion, 7.3% of GNI*** *(ratio our calculation)* (**BPA39**). CA* removes the depreciation and IP flows of the multinational sector: *"CA*=CA less (depreciation on R&D service imports and trade in IP + aircraft leasing depreciation + redomiciled incomes + R&D related IP exports) adding back (net aircraft related to leasing + R&D related IP imports + R&D service imports)"* ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-ia/internationalaccountsq12026final/modifiedcurrentaccount2025/)).
- **Merchandise trade, customs basis** (**TSA06**): exports €258.9 billion, of which medicinal and pharmaceutical products €137.6 billion and food and live animals €16.7 billion; imports €144.7 billion, of which machinery and transport equipment €60.3 billion, chemicals €37.5 billion, food €11.3 billion and fuels €7.5 billion.
- **Services** (**BPA19**): exports €517.3 billion, of which computer services €312.6 billion; imports €489.1 billion, of which royalties and licences €185.0 billion and business services €182.4 billion (R&D €64.2 billion). Tourism earned €7.0 billion and Irish residents spent €11.0 billion abroad.
- **Irish-owned exporters.** Enterprise Ireland client firms exported a record **€38.86 billion** in 2025 and *"spent €43.73 billion in the Irish economy including €13.69 billion on payroll"* ([Enterprise Ireland *Annual Report 2025*](https://www.enterprise-ireland.com/resource/blob/202032/6a854a9aec94dffff510d1d93eeb68d4/2025-annual-report-and-accounts-download--data.pdf)). In goods, *"87% of the value of exports was from foreign-owned enterprises"* in 2022 ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-pte/profileoftradingenterprises2022/ownershipofenterprises/)); in services, foreign-controlled firms exported €326 billion (82%) in 2023 and domestic firms €73 billion ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-stec/servicestradebyenterprisecharacteristics2023/)).

### 2.5 Investment and prices

- **Gross fixed capital formation was €145.3 billion, but modified investment only €73.2 billion** (**NAQ05**): dwellings €14.7 billion, improvements €9.0 billion, other construction €18.4 billion, machinery and equipment €17.1 billion, intangibles (excluding R&D and IP) €12.2 billion.
- **Consumer prices** rose 2.2% in 2025 (**CPA01**); the 12-month rate in September 2026 was 4.1% (**CPM20**).

**For the model.** The domestic economy that the republic actually runs is the GNI* economy: about €334 billion, with households consuming €154 billion and modified investment of €73 billion. Its export base outside the multinationals is narrow. Irish-owned firms export around €39 billion through Enterprise Ireland clients, plus agri-food (€19 billion, partly the same firms) and tourism (€7 billion). That narrow base is what must pay for energy, food and medicines once the multinationals' local spending shrinks.

## 3. The public finances today

### 3.1 Revenue and spending

**General government, 2025** ([CSO, Government Finance Statistics, April 2026](https://www.cso.ie/en/releasesandpublications/ep/p-gfsa/governmentfinancestatistics2025april2026/keyfindings/); GNI* €333,971m from CSO NA001; ratios *our calculation*):

| | € million | % of GNI* |
|---|---|---|
| Revenue | 145,053 | 43.4 |
| – of which taxes | 111,630 | 33.4 |
| – of which social contributions | 24,605 | 7.4 |
| Expenditure | 133,831 | 40.1 |
| **Surplus** | **11,222** | **3.4** |

The CSO describes *"a surplus of €11.2 billion in 2025, or 1.8% of Gross Domestic Product"*. The Department of Finance's vintage gives €10.7 billion, 3.2% of GNI* ([Budget 2027 Economic and Fiscal Outlook (EFO), October 2026](https://assets.gov.ie/static/documents/a1841801/Budget_2027_-_Economic_and_Fiscal_Outlook_-_Final_3_002.pdf), Table 15).

**Exchequer tax receipts, 2025 outturn** (EFO Table 11): income tax including USC **€36.6 billion**; VAT **€22.9 billion**; corporation tax **€34.7 billion** (including €1.8 billion of once-off receipts from the CJEU Apple judgment); excise €6.5 billion; capital gains tax €2.1 billion; capital acquisitions tax €1.1 billion; stamp duties €1.9 billion; motor tax €0.9 billion; customs €0.6 billion; **total €107.4 billion**. Non-tax revenue was €3.5 billion. PRSI (€19.5 billion) and the local property tax (€0.7 billion) are collected outside the Exchequer tax heads ([Revenue, *Annual Report 2025*](https://www.revenue.ie/en/corporate/press-office/annual-report/2025/headline-results.pdf)).

**Spending by function, 2024**, the latest available ([Eurostat gov_10a_exp](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?geo=IE&unit=MIO_EUR&sector=S13&na_item=TE); % of GNI* using GNI* 2024 of €321,636m, *our calculation*):

| Function | € million | % of GNI* |
|---|---|---|
| Social protection (of which old age €16,827m) | 45,799 | 14.2 |
| Health | 29,243 | 9.1 |
| Education | 15,073 | 4.7 |
| Economic affairs | 11,673 | 3.6 |
| General public services (of which debt interest €3,420m) | 11,160 | 3.5 |
| Public order | 4,162 | 1.3 |
| Housing and community | 3,389 | 1.1 |
| Environment | 2,348 | 0.7 |
| Recreation and culture | 2,310 | 0.7 |
| Defence | 841 | 0.3 |
| **Total** | **125,998** | **39.2** |

### 3.2 The windfall: a surplus that is not really there

- **Concentration.** *"The Top 10 companies accounted for 56% of net CT receipts in 2025 … Foreign owned multinationals paid €28.8 billion (87% of net CT receipts)."* They were *"11% of the companies making CT payments"* ([Revenue, *CT analysis 2026*](https://www.revenue.ie/en/corporate/documents/research/ct-analysis-2026.pdf)). The Fiscal Council found that *"almost half of the Corporation Tax collected by the State is paid by three multinational companies … around €13 billion or 46%"* in 2024 ([RTÉ, February 2026](https://www.rte.ie/news/business/2026/0219/1559232-ifac-corporation-tax/)).
- **The underlying position is a deficit.** The Department of Finance classes **€16.8 billion** of 2025 corporation tax as "potentially transitory" (€18.8 billion in 2026, €22.9 billion in 2027). Without it, the general government balance was **−€6.1 billion in 2025**, and is projected at −€12.1 billion in 2026 and −€13.4 billion in 2027: *"The underlying deficit is projected at €13.4 billion (3.5 per cent of GNI*)"* (EFO, Table 15).
- **The Fiscal Council (IFAC):** *"'Excess' corporation tax receipts are those receipts which cannot be explained by domestic economic activity … The underlying deficit this year is forecast to be €11 billion (3% of national income). This deficit is forecast to widen to almost €21 billion by 2030"* ([IFAC opening statement to the Oireachtas, June 2026](https://data.oireachtas.ie/ie/oireachtas/committee/dail/34/committee_on_budgetary_oversight/submissions/2026/2026-06-16_opening-statement-seamus-coffey-chairperson-irish-fiscal-advisory-council_en.pdf)). IFAC's own € estimate of excess receipts (reported at about €18.4 billion) could not be checked: UNVERIFIED. No IFAC scenario for the loss of the largest firms was found.

**For the model.** This is the most important single fact about how Ireland "stays afloat" today: **without the multinationals' windfall corporation tax the State already runs a deficit of about 2–3½% of GNI*, before any change of system.** The republic's starting point is the underlying balance, not the headline surplus. Article 60 ring-fences the windfall in the Social Wealth Fund for exactly this reason.

### 3.3 State funds

- **The Future Ireland Fund and Infrastructure, Climate and Nature Fund Act 2024** requires that *"in each of the years 2024 to 2035, the Minister shall … pay into the FI Fund a sum equivalent to 0.8 per cent of relevant GDP"* (s.8(1); reducible to 0.4% or nil in a downturn, s.9). Nothing may be paid out of the Future Ireland Fund *"before 2041"*, and annual drawdowns are capped at 3% of net asset value (s.11) ([Irish Statute Book](https://www.irishstatutebook.ie/2024/en/act/pub/0016/sec0008.html)).
- **Balances at end-2025:** Future Ireland Fund about **€12.7 billion**; Infrastructure, Climate and Nature Fund about **€4.1 billion**; Ireland Strategic Investment Fund **€16.1 billion** ([NTMA *Annual Report 2025*](https://assets.ntma.ie/general/NTMA-Annual-Report-Financial-Statements-2025.pdf)). Together: about **€32.9 billion** *(our calculation)*, largely invested abroad.
- The Exchequer held cash and liquid assets of *"almost €39 billion at the start of the year"* (2026), projected to fall to *"c. €22 billion"* by the end of 2026; the Apple escrow funds are being used for capital spending (EFO).

**For the model.** On exit day these funds are the republic's largest stock of foreign-currency assets that it controls outright. The model counts them as the starting Social Wealth Fund.

### 3.4 Debt and interest

- **Gross debt €209.9 billion at end-2025, 62.9% of GNI*** (net debt €138.2 billion); €38,454 a person ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-gfsa/governmentfinancestatistics2025april2026/keyfindings/)). The weighted average maturity of medium- and long-term debt was 9.6 years (NTMA, above).
- **Interest:** €2.97 billion in 2025, about 0.9% of GNI*; the effective interest rate was 1.4%, projected to rise to 2.7% by 2030, when interest reaches €6.4 billion: *"debt service costs are set to double between now and the end of the decade"* (EFO).

### 3.5 Pensions and ageing

- The old-age dependency ratio (people 65+ per 100 aged 20–64) was **26.6** in 2025 ([CSO PEA29](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/PEA29/JSON-stat/2.0/en)). CSO projections (base 2022 = 23.1) reach 39–45 by 2047 and 47–56 by 2057, depending on the variant ([CSO PEC22](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/PEC22/JSON-stat/2.0/en)).
- The Department of Finance's *Future Forty* projects voted spending rising *"from 33 per cent of GNI* in 2025, to 39.2 per cent of GNI* in 2065"*, a deficit *"reaching 7.9 per cent by 2065"* and debt of *"148 per cent of GNI*"* on unchanged policy; *"116 people in the labour force … for every 100 not working. By 2065, 98"*; and windfall corporation tax falling *"from 8 per cent of GNI* in 2025 to 4.5 per cent of GNI* by 2040"* ([Department of Finance, November 2025](https://assets.gov.ie/static/documents/6126c05d/Future_Forty_-_Summary_Note_-_for_Print.pdf)).
- Auto-enrolment pensions (MyFutureFund) began on 1 January 2026, with contributions rising from 1.5% employee, 1.5% employer and 0.5% State to 6/6/2 by year ten (secondary source: [University of Galway](https://universityofgalway.ie/payroll/deductionsinformation/myfuturefund-autoenrolment/)). The Social Insurance Fund is *"likely to move into deficit from the mid-2030s"* (EFO).
- Pension liabilities at end-2021: public service pensions €175.7 billion; the social-insurance State Pension €470.7 billion; all schemes €767.3 billion, 329% of GNI* ([CSO](https://cso.ie/en/releasesandpublications/ep/p-eipl/estimatesofirishpensionliabilities2021/keyfindings)).

**For the model.** Ageing is a slow, certain pressure that does not depend on the change of system: it raises transfers by several points of GNI* over decades. The model's ten-year transition sees only its beginning; the long-run view notes it.

### 3.6 Fiscal prudence: the Fiscal Council's position

IFAC's June 2026 statement: *"net spending is planned to increase by 7% per year on average. This is much faster than the sustainable growth rate … Ireland needs its own domestic fiscal rule. This should be carefully designed and placed in legislation"*; *"Out of every €6 the Government collects in corporation tax; it plans to spend €5 and save just €1"*; and *"Since Budget 2024, almost 30% of the additional spending (€6.8 billion) is due to overruns."* On Budget 2027 it said a *"sustainable speed limit of 5%"* for spending growth had been set in 2021, but governments had *"actually deliver[ed] about 10% a year on average"*, and that *"The Government continues to use high-risk receipts to fund permanent tax and spending measures"* ([Irish Examiner, October 2026](https://www.irishexaminer.com/business/economy/arid-41920651.html)).

**The design accepts the core of this.** Windfall money must not fund permanent spending (Art. 60), and overruns are a real failure mode (FM-06). Where it parts company with IFAC is the target: the design is willing to run a deficit for investment, financed partly by its own central bank, which IFAC-style prudence would regard as a risk to be avoided. Section 7 sets out that disagreement.

## 4. Import dependence: energy, food, medicines

### 4.1 Energy

- **Imports of mineral fuels (SITC 3) were €7.49 billion in 2025** (€7.90 billion in 2024, €10.21 billion in 2023): petroleum €5.03 billion, gas €1.65 billion, electricity €0.77 billion, coal €0.05 billion ([CSO TSA06](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/TSA06/JSON-stat/2.0/en)).
- *"Ireland's overall energy imports dependency in 2025 was 78.2% … the average EU energy imports dependency in 2024 was 57.3%."* Imports were 92.8% fossil fuels; *"55.5% energy imports came from the UK, 16.9% came from the USA, 16.2% came from EU countries"*; and *"All physical flows of electricity and natural gas imports come into Ireland from the UK through international interconnectors"* ([SEAI, *First Look: Energy Supply & Security of Supply 2025*](https://www.seai.ie/sites/default/files/2026-07/First_Look_Energy_Supply_and_Security_of_Supply_2025.pdf)).
- **Gas:** import dependency 82.3% in 2025. In summer 2025 *"Indigenous supply sources accounted for 19.4% of total ROI demand, with the Moffat Entry Point supplying the remaining 80.6%"*; Corrib is forecast to meet 14.8% of demand in summer 2026 ([Gas Networks Ireland, *Summer Outlook 2026*](https://www.gasnetworks.ie/sites/default/files/2026-06/Summer-Outlook-2026.pdf)).
- **Oil:** *"All oil-products to the Irish market are ultimately sourced from international imports."* Whitegate, the only refinery, supplied 73.5% of petrol, 31.8% of diesel and gas oil and 14.5% of kerosene in 2025 (SEAI, above).
- **Renewables:** *"In 2025, 40.9% of Ireland's gross electricity supply … was renewable"* (SEAI, above).

**For the model.** Almost all of Ireland's energy imports physically arrive from or through Britain. That matters more outside the EU than inside it: the UK relationship, not the EU one, keeps the lights on.

### 4.2 Food and farm inputs

- **Food and live animals (SITC 0) imports were €11.29 billion in 2025, and beverages and tobacco (SITC 1) €1.56 billion: €12.85 billion in total**, against exports of €18.91 billion. Within SITC 0: cereals €2.02 billion, fruit and vegetables €1.94 billion, meat €1.40 billion, dairy €1.21 billion ([CSO TSA06](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/TSA06/JSON-stat/2.0/en)).
- **Self-sufficiency in meat, 2024:** beef and veal **701%**, sheep 385%, pig 210%, poultry **72%**, all meat 233% ([CSO ABA06](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/ABA06/JSON-stat/2.0/en)). The latest CSO cereal self-sufficiency figure found is 92% for 2011/12 ([CSO](https://www.cso.ie/en/statistics/agriculture/cerealssupplybalance)). Dairy self-sufficiency: UNVERIFIED (no official ratio found); milk intake was a record 8.5 billion litres in 2025 ([Irish Times](https://www.irishtimes.com/business/2026/04/24/mergers-inevitable-if-irish-dairy-co-ops-are-to-survive-rising-costs-and-falling-milk-prices/)).
- **Feed:** imports of feeding stuffs (SITC 08) were €1.28 billion in 2025 (CSO TSA06); about 4.37 million tonnes of grain, beet and oilseed products were imported, mostly for feed, including 1.71 million tonnes of maize and over 818,000 tonnes of soybean meal ([Irish Farmers Journal](https://www.farmersjournal.ie/tillage/news/feed-imports-increase-driven-by-maize-jump-911465)).
- **Fertiliser:** imports of manufactured fertilisers (SITC 56) were €644 million in 2025 (CSO TSA06); *"Total chemical N Use – 349,293 tonnes"* ([Teagasc](https://teagasc.ie/news--events/daily/progress-on-climate/)).
- **The herd:** *"The number of cattle in Ireland in June 2025 was 6,904,800, a fall of 278,300 (-3.9%)"* ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-clsjf/cropsandlivestocksurveyfinalresultsjune2025)). Agriculture was **38.7%** of greenhouse-gas emissions in 2025 (provisional) ([EPA](https://www.epa.ie/publications/monitoring--assessment/climate-change/air-emissions/infographic_provisional_GHG_1990-2025.pdf)).

**For the model.** Ireland is a large net food exporter in money terms, but its livestock system runs on imported feed and fertiliser (about €1.9 billion a year), and it imports most of its cereals, fruit and vegetables. A smaller herd cuts those input imports as well as exports.

### 4.3 Medicines

- Imports of medicinal and pharmaceutical products (SITC 54) were **€22.77 billion** in 2025, against exports of €137.6 billion (CSO TSA06). Almost all of this is the multinational sector's own trade. **How much of what Irish patients use is imported: UNVERIFIED** (no official figure found).
- The State's spending on medicines was projected at *"almost €3 billion"* for 2024 ([Irish Times](https://www.irishtimes.com/business/2024/04/11/stronger-focus-on-generic-medicines-could-save-hse-cash-says-industry-report/)); *"generics account for 58 per cent of all prescribed medicines in Ireland"* (same source).

**For the model.** We treat about €3 billion a year as the medicines bill that must be paid in foreign currency after exit. That is an assumption: some of it is made in Ireland.

## 5. What the State and co-operatives already own

### 5.1 Commercial State companies

NewERA's review of the commercial State portfolio, mostly for 2024: turnover **€18.1 billion**, profit after tax €1.53 billion, net assets €22.4 billion, dividends paid €337 million, and **47,423 employees** ([NTMA/NewERA, *Annual Financial Review 2024/25*](https://www.ntma.ie/uploads/publication-articles/NewERA-Annual-Financial-Review-2024-25.pdf)). In 2025 the Exchequer received €398 million in dividends from 24 State companies, whose combined operating profit rose 28% to €2.4 billion ([Irish Times](https://www.irishtimes.com/business/2026/07/10/state-owned-companies-pay-398m-in-dividends-to-exchequer/)).

| Company (2024) | Turnover | Employees | Profit after tax | Dividend |
|---|---|---|---|---|
| ESB | €7,250m | 9,588 | €706m | €220m |
| CIÉ Group (Irish Rail, Bus Éireann, Dublin Bus) | €1,844m | 12,426 | €0m | — |
| Uisce Éireann | €1,606m | 2,108 | €279m | — |
| daa | €1,111m | 4,176 | €240m | €39m |
| EirGrid | €1,106m | 610 | €10m | €4m |
| An Post | €1,021m | 10,209 | €6m | — |
| Gas Networks Ireland | €600m | 848 | €138m | €44m |
| Coillte | €390m | 863 | €15m | €4m |
| RTÉ | €380m | 1,853 | €6m | — |
| Bord na Móna (to March 2025) | €254m | 1,025 | €26m | €14m |

Source: NewERA, above. CIÉ's Exchequer funding was €1,160 million, 63% of its turnover. For 2025, ESB reported *"Profit after Tax of €636m"*, a *"Proposed dividend of €149m"* and *"Record capital investment of €2.7bn"* ([ESB](https://esb.ie/news---insights/press-releases/2025/2026/03/25/esb-group-announces-2025-annual-results)).

**The public sector as a whole employed 472,000 people in Q2 2026** (401,000 excluding semi-State companies): health 173,600, education 109,200, civil service 54,600, regional bodies 40,100, Garda 15,200, Defence 8,300; semi-State companies 71,100, of which commercial 51,500 ([CSO EHQ10](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/EHQ10/JSON-stat/2.0/en)).

**For the design.** The grid, electricity generation, gas networks, water, public transport, forestry, the post, airports and broadcasting are already State-owned. The "national public enterprise" tier of Article 47 does not start from nothing: it starts from a portfolio with about €18 billion of turnover and some 50,000 commercial employees.

### 5.2 Co-operatives and credit unions

- *"In total, there are 1,000 co-ops in Ireland"*, with *"a combined turnover in the region of €16 billion, with 175,000 individual members, employing 12,000 people in Ireland, and a further 24,000 people overseas"* ([ICOS, December 2025](https://icos.ie/2025/12/09/end-of-year-message-from-icos-president-edward-carr/)). Four dairy co-ops and processors (Lakeland, Kerry Co-op, Tirlán, Dairygold) *"process about 80 per cent of the Republic's milk"* ([Irish Times](https://www.irishtimes.com/business/2026/04/24/mergers-inevitable-if-irish-dairy-co-ops-are-to-survive-rising-costs-and-falling-milk-prices/)).
- **Conversion and buy-back.** Kerry Group plc was floated in October 1986 ([Kerry corporate history](https://www.kerry.com/docs/history/Kerry-Group-Corporate-History-22-2-15.pdf)); the co-op bought back 70% of Kerry Dairy Ireland at the end of 2024 ([Dairy Reporter](https://www.dairyreporter.com/Article/2025/01/06/kerry-completes-first-phase-of-dairy-business-disposal/)). Avonmore and Waterford merged in 1997 and became Glanbia in 1999 ([Avonmore](https://avonmore.ie/node/166)); in December 2021 farmer shareholders voted to buy the remaining 40% of Glanbia Ireland, renamed Tirlán in 2022 ([Tirlán](https://www.tirlan.com/our-story/news/glanbia-ireland-reveals-new-identity)). This history is the case for Article 50.4, which forbids converting a co-operative into a shareholder-owned company.
- **Credit unions** (year to September 2025): assets **€22.5 billion**, loans €7.7 billion, member savings €18.7 billion ([Central Bank of Ireland](https://www.centralbank.ie/news/article/press-release-central-bank-publishes-financial-conditions-of-credit-unions-report-8-april-2026)); 172 credit unions, down from 369 ([Co-operative News](https://www.thenews.coop/?p=195549)). Their low loan-to-savings ratio (about 41%, *our calculation*) is unused lending capacity for the public banking network of Article 61.

### 5.3 Housing

There were **36,284** new dwelling completions in 2025 ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-ndc/newdwellingcompletionsq42025)); social housing output was 10,571 ([ICSH](https://icsh.ie/housing-associations-deliver-record-number-of-homes-in-2025/)). The social housing stock was about 189,800 (10.3% of all dwellings) in 2022 by Housing Europe's estimate ([Housing Europe](https://www.housingeurope.eu/wp-content/uploads/2025/10/ireland_the_state_of_housing_in_the_eu_2025_digital.pdf)); an official 2025 figure was not found (UNVERIFIED). The Land Development Agency has completed 3,215 homes since 2022, with a pipeline of over 28,000 ([LDA](https://lda.ie/news/mid-year-update)).

## 6. Physical flows: energy, emissions, land and materials

The ecological limits of the design (FM-16; Arts. 63–67) are physical, so the Economy section shows physical flows alongside money. CSO tables are cited by code; the API pattern is `https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/{CODE}/JSON-stat/2.0/en`. 1 ktoe = 11.63 GWh.

### 6.1 Energy, 2024 (the latest full balance)

From the SEAI National Energy Balance as published by the CSO (**SEI01**, ktoe):

- **Primary supply** 14,637 ktoe (about 170 TWh): oil 7,257; natural gas 4,274; renewables 2,106 (of which wind 1,002, liquid biofuel 365, solid biomass 253, renewable waste 156, solar 108, ambient heat 104, hydro 66); net electricity imports 435; coal 282; non-renewable waste 156; peat 128. **Indigenous production was 2,963 ktoe; imports 12,883 ktoe.**
- **Electricity generation:** inputs to public thermal plants were natural gas 2,184, coal 161, oil 149, biomass and wastes 316; wind 1,002, hydro 66 and solar 94 went directly to electricity; net interconnector imports 435. Thermal conversion losses were about 1,542 ktoe *(our calculation)*. Final electricity consumption was 2,825 ktoe (32.9 TWh).
- **Final consumption** 12,360 ktoe: **transport 5,224** (of which international aviation 1,113 and road 3,453); residential 2,636; industry 2,182; commercial and public services 2,034 (of which information and communication, where data centres sit, 702, almost all electricity); agriculture 262; fisheries 21.
- **Provisional 2025:** primary requirement 163.1 TWh; oil 47.3%, gas 29.9%, renewables 15.9%, net electricity imports 3.8%; gross electricity supply 37.5 TWh, of which gas 15.0, wind 12.0 and net imports 6.1 TWh ([SEAI First Look 2025](https://www.seai.ie/sites/default/files/2026-07/First_Look_Energy_Supply_and_Security_of_Supply_2025.pdf)).
- **Data centres used 7,662 GWh of 32,987 GWh of metered electricity in 2025: 23.2%** (21.9% in 2024, 20.7% in 2023) ([CSO MEC02](https://data.cso.ie/table/MEC02)).
- The latest official renewable share of electricity (RES-E) is **40.4% for 2023** ([CSO G0706](https://data.cso.ie/table/G0706)).

### 6.2 Greenhouse gases

- **Provisional 2025: 52.65 Mt CO2eq** excluding land use (−2.3% on 2024): agriculture 20.40; transport 11.61; energy industries 6.59; residential 5.21; manufacturing combustion 4.16; industrial processes 1.83; waste 0.82; commercial 0.71; public services 0.68; F-gases 0.64. Land use (LULUCF) added a net 2.51 Mt ([EPA, July 2026](https://www.epa.ie/news-releases/news-releases-2026/irelands-greenhouse-gas-emissions-decrease-by-22-in-2025-.php)).
- **Land use is a net source, not a sink:** in 2024 wetlands emitted a net 3.37 Mt and grassland 2.37 Mt, while forests removed 2.57 Mt and harvested wood 0.79 Mt. *"The main sources of emissions are the drainage of grasslands on organic soils and the drainage of wetlands for peat extraction"* (EPA, *Ireland's Final Greenhouse Gas Emissions 1990–2024*, Table A.1).
- **Carbon budgets:** *"Budget 1 from 2021-2025 has been set at 295 Mt CO2eq. Budget 2 from 2026-2030 has been set at 200 Mt CO2eq. Budget 3 from 2031-2035 has been set at 151 Mt CO2eq"* (EPA, same report). The EPA says Ireland was provisionally under its first budget by 1.1 Mt. Sectoral ceilings for 2026–30 include agriculture 96 Mt, transport 37 Mt and electricity 20 Mt (the 2022 Government decision, as reproduced by [MaREI/UCC](https://www.marei.ie/wp-content/uploads/2022/10/Prospects-for-Sectoral-Emissions-Ceilings-October-2022.pdf); the gov.ie original could not be opened).

### 6.3 Land and farming

- **Livestock, June 2025** (**AAA09**): cattle 6,904,800, of which dairy cows 1,587,900 and other cows 778,500; sheep 5.10 million; pigs 1.57 million. June 2026: cattle 7.07 million, dairy cows 1.62 million.
- **Milk** intake by processors in 2025 was **8,835 million litres** (**AKA01**); liquid milk sold for drinking was 486 million litres, about 5.5% (*our calculation*). Nearly all Irish milk becomes manufactured dairy products, most of them exported.
- **Meat balance, 2024** (**ABA06**, thousand tonnes): beef production 655.5, exports 548.8, domestic use 93.5; poultry production 189.5, imports 157.8, domestic use 263.0. Meat consumption was 100 kg a person.
- **Land, June 2025** (**AQA06**): 4.49 million hectares farmed, of which pasture 2.35, silage 1.13, rough grazing 0.53, hay 0.09 and crops 0.38 million hectares. **About 91% of farmland is grass** *(our calculation)*. Forest covers 11.6% of land (National Forest Inventory 2022, via the EPA). Peat soils cover about 1.46 million hectares, roughly a fifth of the land (Connolly and Holden 2009, as cited by the University of Limerick; partly verified).
- **Nitrogen fertiliser** sales were 349,293 tonnes of N in 2025, up 12.5% (**PFSA01**). The cereal harvest was 2.31 million tonnes (**AQA04**).

### 6.4 Materials and waste

- **Material Flow Accounts 2024** ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-mfa/materialflowaccounts2024/keyfindings/)): domestic extraction 95.8 Mt plus imports 45.1 Mt, less exports 17.7 Mt, gives **domestic material consumption of 123.3 Mt, 22.9 tonnes a person** (EU 13.3). By material: non-metallic minerals 57.1 Mt, biomass 47.4 Mt (of which grazed grass 22.9 Mt), fossil fuels 12.5 Mt, metals 5.3 Mt. Net additions to stock (buildings and infrastructure) were 61.6 Mt.
- **Municipal waste** was 3.11 million tonnes in 2024: 43% recycled, 41% burned for energy, 15% landfilled ([EPA](https://epa.ie/our-services/monitoring--assessment/waste/national-waste-statistics/municipal)).

**For the model and the physical-flows view.** Three facts dominate: **transport oil** is the largest energy flow and almost entirely imported; **the herd** is the largest source of greenhouse gases and, through grazed grass, the largest biomass flow; and **drained peat soils** make land a net source of emissions. Data centres are a quarter of metered electricity. The design's first designated sectors (data centres, aviation, the herd; Art. 114) are exactly these flows.

## 7. The hard constraints outside the EU

Leaving the EU and the euro is covered in [13](13-leaving-the-eu.md): the law, the currency changeover, the land border and trade terms. This section takes the four constraints that decide whether the republic's accounts close.

### 7.1 The currency: transition, devaluation and import prices

- **What to expect.** There is no current estimate of an Irish devaluation on leaving the euro ([13 §2.3](13-leaving-the-eu.md)). Comparators: sterling fell about 15% in 1992 with little inflation; Iceland's króna fell 65% on a trade-weighted basis in 2008, with inflation peaking at 18.6%; Argentina's peso lost over two-thirds of its value in 2002, with 41% inflation; Nomura's 2011 break-up scenario put an Irish fall at about 30%. **The model treats the fall as a slider from 0% to 50%.**
- **Pass-through to consumer prices.** An IMF study finds that a 1% depreciation raises consumer prices by *"0.16 percent after one year"* on average, *"Advanced economies: 0.08 … Emerging market economies: 0.3 percent after one year"*, that pass-through into import prices is about 0.7, and that *"Pass-through increases with the prevailing level of inflation"* ([IMF WP/23/86](https://www.imf.org/-/media/files/publications/wp/2023/english/wpiea2023086-print-pdf.pdf.md)). BIS researchers find long-run pass-through of about 0.09 in advanced economies and 0.25 in emerging markets after the financial crisis, and 0.71 for emerging markets before it ([Jašová, Moessner and Takáts, *International Journal of Central Banking* 2019](https://www.ijcb.org/sites/default/files/journal/v15n3/ijcb-v15n3-exchange-rate-pass-through-what-has-changed-crisis.pdf)). Ireland's own sterling pass-through is about 21% in the long run ([13 §2.4](13-leaving-the-eu.md)). **A new currency with no track record is likely to sit at the high end of these ranges**, because pass-through is highest where credibility is lowest. The model's pass-through parameter is set accordingly and labelled as an assumption.
- **Central bank governance.** The design's answer (Art. 61) is set out in [13](13-leaving-the-eu.md) and DECISIONS D-45: the Assembly sets the mandate and the inflation target in public; the Bank is insulated in operation; lending to the State has a voted annual ceiling; minutes and votes are published.

### 7.2 Paying for imports from outside the EU

Before any change, the republic's essential imports are about **€7.5 billion of energy, €12.9 billion of food and drink, and about €3 billion of medicines a year** (section 4), roughly **€23 billion in all, about 7% of GNI*** *(our calculation)*. What pays for them today, outside the multinationals' own trade:

| Foreign-currency earnings (approximate, latest year) | € billion | Source |
|---|---|---|
| Enterprise Ireland client exports | 38.9 | §2.4 |
| Agri-food exports (overlaps with the line above) | 19.0 | [13 §4.1](13-leaving-the-eu.md) |
| Tourism receipts | 7.0 | §2.4 |
| **Multinationals' spending in Ireland** (payroll €26.0bn, services €12.2bn, materials €5.1bn) | **43.3** | ABSEI 2024, §7.3 |
| Corporation tax paid by foreign-owned multinationals | 28.8 | §3.2 |

**The single largest source of foreign currency for the domestic economy is the multinationals' own spending here**: wages, Irish suppliers and tax. When a multinational leaves, its exports were never "Irish" earnings, but its local spending was. That is the channel the model follows.

### 7.3 What happens if the multinationals leave

- **Their local footprint.** In 2024, *"direct expenditure by foreign firms amounted to €43.3 billion, comprising €26.0 billion on payroll, €12.2 billion on services purchased in Ireland and €5.1 billion on materials purchased in Ireland"*, against foreign-owned sales of €494.2 billion; *"Direct Expenditure by foreign–owned firms as a percentage of GNP stands at 10.3% in 2024 down from 17.9% in 2000."* Payroll averaged €98,355 per person in foreign-owned client firms, against €64,657 in Irish-owned ones ([Department of Enterprise, *Annual Business Survey of Economic Impact 2024*](https://www.enterprise.gov.ie/en/publications/publication-files/annual-business-survey-of-economic-impact-absei-2024-.pdf)).
- **Jobs.** Foreign-owned agency client firms employed 325,288 people in 2025 (§2.2). The Department of Enterprise and IDA claim *"over eight jobs being created for every 10 jobs in an FDI company"* ([DETE, 2019](https://enterprise.gov.ie/en/news-and-events/department-news/2019/january/03012019a.html)); no method is published, so this is treated as an agency claim. **In the model, indirect jobs are not assumed: they follow from the fall in the multinationals' purchases and wages through the domestic economy.**
- **Earnings.** *"Employments in Irish-owned enterprises accounted for 74.9% of total employments and 65.2% of total earnings in 2023, while employments in US-owned enterprises accounted for 9.0% of total employments and 17.1% of total earnings"* ([CSO](https://www.cso.ie/en/releasesandpublications/fp/fp-peeifoe/proportionofemploymentsandearningsbyirishandforeignownedenterprises2023/)).
- **Tax.** *"In 2017, foreign-owned multinationals in manufacturing, tech, and financial services accounted for 16% of all tax and PRSI receipts. By 2024, that figure had almost doubled to 28%"* ([IFAC blog, June 2026](https://www.fiscalcouncil.ie/?p=11541)). Excess corporation tax was **€17.6 billion in 2025** and €18.7 billion forecast for 2026 ([IFAC *Fiscal Assessment Report*, November 2025](https://www.fiscalcouncil.ie/wp-content/uploads/2025/11/Fiscal-Assessment-Report-November-2025.pdf), Table 2.7).
- **One firm, by the numbers.** IFAC's stylised exit of one large multinational (2016 data) would *"reduce government revenues by over €330 million, close to half a per cent of total revenue … directly reduce GVA by 1.9 per cent, whereas the reductions to employment, employee earnings and taxes would all be considerably lower with all under 0.5 per cent"* ([IFAC 2018, Box C](https://www.fiscalcouncil.ie/wp-content/uploads/2018/06/FAR-June-2018-Box-C-Impact-of-Large-Multinational-Firm-Exit.pdf)).
- **A sector shock.** The ESRI estimates that *"A 10% employment reduction in pharmaceuticals and information and communication sectors could lower GNI* by 1.5% … lower private consumption expenditure moderately by 1.9% in 2030"* ([ESRI, December 2025](https://www.esri.ie/news/esris-economic-outlook-examines-various-risks-to-and-opportunities-for-irelands-economy-for)).

**Scenarios, not a guess.** Leaving the EU removes the main reason many multinationals are here: a tariff-free base inside the single market with a low corporation-tax rate. The charter regime (Art. 52) is meant to keep those that want to stay on published terms. How many would stay is unknowable in advance. The model therefore treats the share that leaves as a slider from 0% to 100%, phased over three years from the first year of the transition. Each position shows its effect on the budget (lost corporation tax and payroll taxes), on the external balance (lost local spending in foreign currency) and on jobs (direct, and indirect through the domestic economy).

### 7.4 Capital flight during the transition (FM-11)

| Case | What happened | Source |
|---|---|---|
| **Chile 1970–73** | *"international reserves dropped from $394 million (1970) to $163 million (1971), a 59% reduction"*; *"the UP government lost 84% of its initial stock of international reserves in a mere two years. By 1973 … equivalent to 22 days of imports"*; inflation *"260.5% in 1972 and 605.1 % in 1973"*; real wages fell 38.6% in 1973. US *"short-term United States commercial credits dropped from around $300 million during the Frei years to around $30 million in 1972"*, Export-Import Bank credits *"dropped to zero in 1971"*, and *"the World Bank made no new loans to Chile between 1970 and 1973"* | Larraín and Meller, [*The Socialist-Populist Chilean Experience*](https://www.nber.org/system/files/chapters/c8301/c8301.pdf) (NBER, 1991), pp. 199–205; US Senate, [*Covert Action in Chile*](https://academic.brooklyn.cuny.edu/history/johnson/churchreport.htm) (1975) |
| **France 1981–83** | Three devaluations of the franc within the EMS: October 1981 (−3.0% against a +5.5% Deutschmark revaluation), June 1982 (−5.75%/+4.25%) and March 1983 (−2.5%/+5.5%), about 8–10% against the mark each time *(our calculation)*. In March 1983 the plan *"limite l'allocation de devises pour les touristes à l'étranger à 2 000 francs … par adulte et par an"* and sought *"une réduction de 65 milliards de francs de la demande intérieure globale"*: the *tournant de la rigueur*. The size of capital flight was not verified | [CVCE](https://www.cvce.eu/content/publication/2001/7/20/929d22c4-ade3-4e1a-b5b0-5ed514f6edba/publishable_en.pdf); [Universalis](https://www.universalis.fr/evenement/23-31-mars-1983-mise-en-place-du-plan-de-rigueur/); [CITECO](https://www.citeco.fr/10000-years-history-economics/contemporary-world/frances-left-wing-economic-policy-and-the-subsequent-austerity-turn) |
| **Iceland 2008–17** | The IMF: *"Deviating from orthodoxy, capital controls were introduced to stabilize the currency"*; they were *"unavoidable"*, and trapped krónur *"found it profitable to invest in government bonds, which facilitated the financing of budget deficit"*. Offshore krónur were *"around 40% of GDP"*; the Central Bank of Iceland later said *"These stabilisation gains of the capital controls were greatest to begin with but have faded with time … The economic costs of the controls … increase over time"* | [IMF Ex Post Evaluation 2012](https://www.sedlabanki.is/library/Skraarsafn/AGS/Iceland-Ex-Post-Evaluation.pdf); [Guðmundsson, BIS 2016](https://www.bis.org/review/r160602b.htm) |
| **Malaysia 1998** | *"Compared to IMF programs, we find that the Malaysian policies produced faster economic recovery, smaller declines in employment and real wages, and more rapid turnaround in the stock market"* | [Kaplan and Rodrik, NBER WP 8142](https://www.nber.org/papers/w8142) |
| **Greece 2015** | Deposits fell by about €37 billion, 23%, *"within a few months"*, until capital controls were imposed (secondary source citing Bank of Greece data) | [Business Daily](https://www.businessdaily.gr/english-edition/33996_greek-deposits-jump-still-below-2014-levels) |

**The IMF has moved.** Its 2012 Institutional View accepted controls on outflows *"during crises or imminent crisis situations"* ([IMF](https://www.imf.org/en/about/faq/capital-flows)); the 2022 review says they *"should not substitute for warranted macroeconomic adjustment"* and *"should be targeted, temporary, and transparent"* ([IMF 2022](https://www.imf.org/en/news/articles/2022/03/30/pr2297-executive-board-concludes-the-review-of-the-institutional-view-on-capital-flows)). Article 61.5 follows the "temporary and transparent" part to the letter.

**What the cases teach.** Chile is the warning: a socialist government without capital controls or external credit lost almost all its reserves in two years, and inflation destroyed real wages. Iceland and Malaysia show that controls work as a brake in a crisis; Iceland shows that their benefits fade and their costs rise the longer they stay. France shows the political end-point when a left programme collides with the external constraint inside a fixed exchange-rate system: retreat. **For the model, capital flight is a slider: the share of household deposits that leaves during the two-year notice period, from 0% to 30% (Greece lost about 23% in months).**

## 8. How a socialist economy is financed: four approaches and their critics

For each approach: the claim in its proponents' words, the evidence, and the strongest critiques from the market side, from fiscal prudence of the IFAC kind, and from the left. Quotations were checked against the linked text unless marked otherwise.

### 8.1 Tax and spend (the Nordic model)

- **Claim.** Kleven attributes Scandinavian success to *"the coverage of third-party information reporting (ensuring a low level of tax evasion), the broadness of tax bases (ensuring a low level of tax avoidance), and the strong subsidization of goods that are complementary to working (ensuring a high level of labor force participation)"* ([Kleven 2014, *Journal of Economic Perspectives*](https://ideas.repec.org/a/aea/jecper/v28y2014i4p77-98.html)).
- **Evidence.** Tax-to-GDP in 2024: Denmark 45.2%, Sweden 41.4%, Norway 40.2%, **Ireland 21.7%** (OECD *Revenue Statistics 2025*, OECD data feed). The OECD itself warns that Ireland's GDP is distorted ([OECD country note](https://www.oecd.org/tax/revenue-statistics-ireland.pdf)). Measured against GNI*, Ireland's take is already high: total tax including social contributions was *"over €126 billion in 2024"* ([CSO](https://www.cso.ie/en/releasesandpublications/ep/p-itxs/irelandstaxstatistics2024/keyfindings/)), about **39% of GNI*** *(our calculation)*, windfall included.
- **Market critique.** Countries compete over tax rates, *"consistent with a belief amongst governments that location choices by multinational firms are discrete"* ([Devereux, Lockwood and Redoano 2008](https://econpapers.repec.org/paper/wrkwarwec/642.htm)).
- **Fiscal-prudence critique.** The base is fragile: *"Budget surpluses are due to a strong economy and corporation tax payments from a few large US companies"* ([IFAC, November 2025](https://www.fiscalcouncil.ie/wp-content/uploads/2025/11/Fiscal-Assessment-Report-November-2025.pdf)).
- **Left critique.** Przeworski and Wallerstein test the "structural dependence of the state on capital" and find that *"in a static sense the theory is false"*, but that *"Policies that … redistribute income without reducing investment do reduce investment during the period in which they are anticipated but not yet implemented"* ([*APSR* 1988](https://ideas.repec.org/a/cup/apsrev/v82y1988i01p11-29_08.html)). That is precisely the two-year notice period of [13 §3](13-leaving-the-eu.md).

### 8.2 Public banks and state investment funds

- **Claim.** State investment banks play *"market creation/shaping"* roles, not *"mere 'market fixing'"*, through *"countercyclical, developmental, venture capitalist, and challenge led"* investment (Mazzucato and Penna, [Levy Institute WP 831](https://levyinstitute.org/wp-content/uploads/2024/02/wp_831.pdf)). Models: KfW, whose obligations the Federal Republic guarantees ([KfW Law, Art. 1a](https://www.kfw.de/PDF/Download-Center/Law-Concerning-KfW/KfW-Gesetz-DE-EN.pdf)); the Bank of North Dakota, whose profits *"are used to benefit the citizens of North Dakota rather than shareholders"* ([BND](https://bndinfo.nd.gov/about-us/overview/)); the German Sparkassen. Norway's rule for its oil fund: *"government spending must not use any of the fund's capital, only its expected real return – currently estimated to 3 %"* ([Norsk Petroleum](https://norskpetroleum.no/en/economy/management-of-revenues/)).
- **Evidence.** Mixed. *"government ownership of banks is associated with slower subsequent financial development … [and] lower subsequent growth of per capita income"* ([La Porta, Lopez-de-Silanes and Shleifer, NBER w7620](https://www.nber.org/papers/w7620)). Against that: *"lending by state banks is less procyclical than lending by private banks, especially in countries with good governance. Lending by state banks in high income countries is even countercyclical"* ([Bertay, Demirgüç-Kunt and Huizinga 2015](https://ideas.repec.org/a/eee/jbfina/v50y2015icp326-339.html)).
- **Market critique.** The same authors concede that *"the track record of state banks in credit allocation remains quite poor"*. Board competence matters: *"supervisory board (in-)competence in finance is related to losses in the financial crisis"* ([Hau and Thum 2009](https://ideas.repec.org/a/oup/ecpoli/v24y2009i60p701-752..html)).
- **Fiscal-prudence critique.** Public banks are contingent liabilities: *"The average fiscal cost of a contingent liability realization is 6 percent of GDP but costs can be as high as 40 percent for major financial sector bailouts"* ([Bova et al., IMF WP 16/14](https://ideas.repec.org/p/imf/imfwpa/2016-014.html)).
- **Left critique.** *"Public banks are neither essentially good nor bad … torn as they are between contending public and private interests in class-divided society"* (Marois, *Public Banks*, Cambridge 2021, publisher's description).

### 8.3 Money creation with a sovereign currency (Modern Monetary Theory)

- **Claim.** *"the issuer of a currency faces no financial constraints … can never become insolvent in its own currency"* (Mitchell, Wray and Watts 2019, as quoted by Mankiw). Kelton: *"MMT is not a free lunch. There are very real limits … MMT is about distinguishing the real limits from the self-imposed constraints"* (*The Deficit Myth*, p. 37, as quoted in [Murphy's review](https://cdn.mises.org/publication_source_pdf/qjae_23_2_murphy_br.pdf)).
- **MMT's own authors on import dependence.** Mitchell: *"There are some growth strategies which will be unsustainable … when an economy that experiences a depletion of foreign exchange reserves has to take some hard decisions … especially if it is reliant on imported fuel and food products"* ([Mitchell 2009](https://billmitchell.org/blog/?p=5402)); and *"a currency depreciation for a nation that is wholly dependent on imported food can be damaging"* ([Mitchell 2013](https://billmitchell.org/blog/?p=25939)).
- **Evidence.** Bernanke praised Korekiyo Takahashi, who *"brilliantly rescued Japan from the Great Depression through reflationary policies"* ([Federal Reserve, 2003](https://www.federalreserve.gov/boarddocs/speeches/2003/20030531/)). The Bank of Japan's own account of what followed: Takahashi *"tried to stop the Bank from underwriting government securities; otherwise, this would lead to hyperinflation. He was eventually assassinated … After his death, the Bank's underwriting … was mismanaged, which led to hyperinflation after World War II"* ([Iwata, BIS 2013](https://www.bis.org/review/r131028c.htm)). IMF staff find monetary expansion *"has modest effects on inflation in countries with strong central bank independence, low initial inflation, and small fiscal deficits … large monetary expansions can have much stronger effects"* ([SUERF Policy Brief 290](https://suerf.org/wp-content/uploads/2023/12/f_694830f169190daee55b64d39c7bae30_41805_suerf.pdf)).
- **Market critique.** Mankiw: *"there is likely a Laffer curve for seigniorage … government default may occur not because it is inevitable but because it is preferable to hyperinflation"* ([NBER w26650](https://www.nber.org/system/files/working_papers/w26650/w26650.pdf)). Blanchard: *"Either money pays interest, in which case it is equivalent to bond finance Or it does not, and high money creation eventually leads to high inflation"* ([slides hosted by IFAC](https://www.fiscalcouncil.ie/wp-content/uploads/2021/02/Olivier-Blanchard-Thoughts-about-fiscal-policy.pdf)).
- **The critique from the periphery, the one that matters most here.** *"what constraints the policy space is not the choice of fixed versus flexible … exchange rate, but the necessity to obtain foreign currency … associated to the needs to import foreign intermediary and capital goods"* ([Vernengo and Pérez Caldentey, PERI WP 495](https://www.peri.umass.edu/images/publication/WP495.pdf)). Palley: in import-dependent economies *"it is the exchange rate rather than capacity utilization that is systematically connected to inflation"* ([IMK WP 109](https://www.imk-boeckler.de/fpdf/HBS-005445/p_imk_wp_109_2013.pdf)).
- **Fiscal-prudence critique.** *"experimentation with this tool should be modest and limited to countries with credible monetary frameworks, low inflation, and sustainable fiscal positions"* (IMF staff, SUERF brief above). A new currency on its first day has none of those.
- **Marxist critique.** *"Without a theory of value, MMTers enter a fictitious economic world"*; *"Capitalist companies, banks and institutions rule, and they make decisions on the basis of profit and profitability"* ([Michael Roberts, *Salvage*, 2021](https://redsails.org/the-modern-monetary-trick/)).

### 8.4 Democratic investment planning

- **Claim.** Adaman and Devine propose participatory planning that *"incorporates both the modern Austrians' insight into the importance of tacit knowledge and Dobb's insistence on ex ante coordination"* ([*Cambridge Journal of Economics* 1996](https://ideas.repec.org/a/oup/cambje/v20y1996i5p523-37.html)). Cockshott and Cottrell: *"investment is socialised and the basic source of 'funding' for accumulation is taxation … proposals regarding the percentage of national income to be devoted to accumulation should be submitted to plebiscite"* ([*Towards a New Socialism*](https://www.dcs.gla.ac.uk/~wpc/reports/tns.epub)).
- **Evidence from planned economies.** Kornai: with a soft budget constraint *"the firm's demand becomes almost insatiable … due primarily to the effect of 'investment hunger'"* ([*Econometrica* 1979](https://www.econometricsociety.org/publications/econometrica/1979/07/01/resource-constrained-versus-demand-constrained-systems)); socialist growth *"has long been characterized by investment hunger, drives toward expansion, and cyclical fluctuation of investment rates"* ([Zou, World Bank WP 615](https://ideas.repec.org/p/wbk/wbrwps/615.html)).
- **Market critique.** Hayek: the relevant knowledge *"never exists in concentrated or integrated form but solely as the dispersed bits of incomplete and frequently contradictory knowledge which all the separate individuals possess"* ([*The Use of Knowledge in Society*](https://www.econlib.org/library/Essays/hykKnw.html)).
- **Fiscal-prudence critique.** Soft budgets bring *"runaway demand and overinvestment in risky ventures"*, and not only under socialism ([Kornai, Maskin and Roland 2003](https://eml.berkeley.edu/~groland/pubs/understanding.pdf)).
- **Left critique of top-down planning.** *"A key criticism of Soviet socialism was the fact that decisions about the rate of growth … were taken by a political elite. This lent to socialist accumulation a partially alienated character"* (Cockshott and Cottrell, above).

### 8.5 Fiscal rules and debt

- **IFAC** wants a domestic rule that *"captures general government spending, is linked to debt targets, and protects public investment with a minimum steady state target set as a percentage of GNI*"* ([IFAC, June 2024](https://fiscalcouncil.ie/wp-content/uploads/2024/06/Fiscal-Assessment-Report-June-2024-Irish-Fiscal-Advisory-Council.pdf)).
- **Blanchard:** *"public debt may have no fiscal cost"* when interest rates are below growth ([AEA 2019](https://www.aeaweb.org/articles?id=10.1257/aer.109.4.1197)); but his own caveats are that the *"Shift from low p to high p is typically very sudden"*, and on debt-financed investment: *"Should it be automatically financed by debt? No."* (IFAC-hosted slides, above).
- **Original sin:** *"an incompleteness in financial markets which prevents the domestic currency from being used to borrow abroad or to borrow long term even domestically"* ([Eichengreen and Hausmann, NBER w7418](https://www.nber.org/papers/w7418)). Market borrowing costs *"often rise abruptly and sharply, but just prior to default"* ([Mauro and Zhou, IMF WP 20/52](https://ideas.repec.org/p/imf/imfwpa/2020-052.html)).

## 9. What this means for the republic's model

1. **The binding constraint is external, not fiscal.** Proponents and critics agree on this for an import-dependent economy: Mitchell on *"imported fuel and food"*, Vernengo and Pérez Caldentey, Palley. A sovereign currency removes the risk of the State running out of its own money. It does not remove the need to earn foreign currency for about €23 billion of essential imports. **So the model's first test is the external balance, measured in months of essential imports covered by reserves.**
2. **Windfall money is not revenue.** The State already runs an underlying deficit of 2–3½% of GNI* without excess corporation tax (§3.2). The model starts from that position, with the windfall ring-fenced in the Social Wealth Fund (Art. 60).
3. **Monetary financing is allowed, but capped, voted and visible** (Art. 61.4). The model lets the Central Bank finance the State only up to the ceiling. Beyond it the budget "breaks": the model does not invent a financing source. It also adds an inflation penalty for money finance (the "credibility premium"). This is the critics' channel, set as a parameter so that readers can turn it up or down.
4. **Inflation from a falling currency is structural.** In the model, consumer prices are a weighted mix of domestic and import prices, so pass-through equals the import share of consumption, which the model calibrates to about a fifth. That sits inside the IMF and BIS ranges (0.08–0.3 after one year). Partial wage indexation spreads the shock over the following years.
5. **Investment needs hard budgets and participation.** The model links the waste in public investment to participation in planning bodies (FM-06, FM-08). This is the weakest-evidenced relationship in the model, and is labelled as the drafter's assumption.
6. **Foreign-currency debt is the main solvency risk.** Debt under foreign law stays in euro after exit and grows in punts when the punt falls. The model carries it separately.
