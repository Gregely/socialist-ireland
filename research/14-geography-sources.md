# 14 — Geographic data: what can actually be sourced (for "The Map")

A sourcing pass for the geographic map page, carried out in October 2026 before building it. Each candidate layer was checked for an official, openly licensed source with **complete county or local-authority coverage**. Where none exists, the layer is marked as excluded, with the reason. Nothing here is estimated.

## Base map

| Item | Source | Licence | Status |
|---|---|---|---|
| **31 local authorities** (26 county councils, 3 city councils, 2 city-and-county councils) | Tailte Éireann, *Local Authorities – National Statutory Boundaries* (ungeneralised; 2024 edition tested, 2026 edition also published) ([data.gov.ie](https://data.gov.ie/), [Tailte Éireann open data](https://data-osi.opendata.arcgis.com/datasets/osi::local-authorities-national-statutory-boundaries-ungeneralised-2024)) | **CC BY 4.0** ("© Tailte Éireann"; the data are generalised and for reference only, and boundaries may not match the Boundary Survey (Ireland) Acts) | ✅ Downloaded and tested: 92 MB in ITM (EPSG:2157), dissolved to 31 features, reprojected to WGS84 and simplified with mapshaper. About 1.5 MB at 4%, and it will be simplified further. **Data quirk:** the Irish name for Tipperary in the source reads "Comhairle Contae Thiobraid Árannraid Árann" (a duplication). It will be corrected in display and the correction noted |
| **Northern Ireland** (muted, not part of the State) | OSNI *Largescale Boundaries – NI Outline* (UK OGL) was the first choice, but **its service returned a holding page** during this pass. Fallback: the island outline from **Natural Earth** 10m map subunits (public domain), *minus* the Tailte Éireann boundary of the State | Public domain (Natural Earth) + CC BY 4.0 (Tailte Éireann) | ✅ Derived area 14,161 km² (NI is about 14,130 km² of land), and the shared border matches the Tailte Éireann line exactly. The coastline is coarser than the State's. Switching to OSNI is a one-line change if its service returns |

## "Ireland now" layers

All from the CSO PxStat API under **CC BY 4.0**, unless stated otherwise.

| Layer | Source table | Geography | Year | Status |
|---|---|---|---|---|
| **Rents** | RTB Average Monthly Rent Report, **RIA02** ([CSO](https://data.cso.ie/table/RIA02)) | 26 counties (Dublin as one county; Cork, Galway and other cities also reported separately, but not on local-authority boundaries) | 2025 (annual) | ✅ All 26 counties present. The four Dublin councils share the "Dublin" figure and the map will say so |
| **Vacancy** (Census) | **F2027** Vacancy Rate, Census 2022 | **31 local authorities** | 2022 | ✅ |
| **Vacancy** (recent) | **VAC14** Local Authority Vacant Dwelling Numbers (low electricity use as a proxy for vacancy) | **31 local authorities** | Q4 2024 | ✅ This measures vacancy *indicated by* electricity meters, not a census count, and will be labelled as such |
| **Dereliction** | — | — | — | ❌ **Excluded.** No national dataset. Only some councils publish derelict-sites registers (e.g. Wicklow, DLR, South Dublin, Roscommon, Fingal, Kildare as a PDF), in different formats and with different definitions. A county map from these would be a patchwork |
| **National herd** | **AAA11** Number of Cattle in June, by county | 26 counties | June 2026 (also 2015–2025) | ✅ This comes from the DAFM AIM register, so its totals (7.07 m for June 2025) are **higher than the CSO survey headline (6.90 m) already used in the research notes**. The layer will cite AIM and explain the difference |
| **Greenhouse-gas emissions by county** | — | — | — | ❌ **Excluded.** There is no official county inventory. Councils' Baseline Emission Inventories use different base years (2018 vs 2019) and methods, and the EPA's 1 km MapEIre grid behind several of them is not on the open-data portals. The map will show national sectoral shares only, as a note, not as a map layer |
| **Data centres** | **MEC02** (national quarterly only) | National | 2025 | ❌ **No county breakdown is published.** The CSO's county electricity table (**MEC03**) splits only residential and non-residential. Facility counts by location exist only in paid market-research reports, which conflict (35 to 37 facilities). **Proposed substitute:** non-residential metered electricity by county (MEC03, 2025), *clearly labelled* as including data centres but not limited to them, with the national data-centre total (23% of metered electricity) shown alongside. **Your call** whether that is useful or misleading |
| **Drained peatland** | **EAP09** Area and Proportion of *Benefiting* Peat Bogs (lands drained under OPW Arterial Drainage and Drainage District schemes), with **EAP03** Peat bog and heath extent (CORINE) | 26 counties | 2018 | ✅ It covers **only drainage by state schemes**, not private field drainage, which is unmeasured and which Teagasc says has probably been *over*-estimated nationally. The layer will be labelled "Peat bog drained under state drainage schemes" |
| **Unpaid carers** | **F4068** Carers (% of population), Census 2022; F4015 for counts | **31 local authorities** | 2022 | ✅ |

## Geography used in the design

- **Article 36** ("Each county and city has a council") and the institution node `county-councils` ("County and city councils") **keep the current 31 local authorities**: Dublin split four ways, and separate Cork and Galway city councils. The design changes their *powers* (Article 36; the chief executive is hired and fired by the council) and adds a *new* parish/ward tier of local assemblies (Article 35). It does not redraw them.
- The new local-assembly tier (2,000–10,000 residents each) **has no existing boundary set**. The map will show it as counts per council, marked as an **assumption**. It will not draw invented polygons.

## Data that could serve the "design" mode (to be checked when building)

- **Wind farms in Ireland** (SEAI; CC BY 4.0; SHP/CSV) and offshore wind applications (Department of Housing; WMS) for the existing base of the energy layer.
- **Rail lines** from the NTA/Transport for Ireland GTFS feeds (licence to be confirmed) for the transport layer.
- Bord na Móna rehabilitation areas: only national totals were found (EAP13). No open polygons have been confirmed yet.
