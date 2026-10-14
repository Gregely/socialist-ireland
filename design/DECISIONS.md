# Design decisions log

A running log of significant choices made, why, and which ones belong to the project owner.

## Decisions made (Phase 1 — research)

| # | Decision | Why | Reversible? |
|---|---|---|---|
| D-01 | Failure modes get stable IDs (FM-01 … FM-16) in `research/SYNTHESIS.md` | Phase 2 safeguards blocks, `institutions.json` and the site's threat-model view all need a common key to link against | Yes. IDs can be renamed, but they should stay stable once Phase 2 starts |
| D-02 | Added four failure modes beyond the brief's list: soft budget constraints (FM-06), participation fatigue (FM-08), insider capture of self-management (FM-09), and emergency-power entrenchment (FM-15) as a cross-cutting mode. Ecological overshoot (FM-16) is included but under-researched | The research turned these up as distinct mechanisms: Kornai; Porto Alegre and Kerala reversals; Yugoslav unemployment and Mondragon's two tiers; the "temporary" measures of 1918–21. Folding them into broader categories would hide the specific counter-mechanisms | Yes |
| D-03 | Split "counter-revolution" into three: from outside or the right (FM-10), blockade and capital flight (FM-11), restoration from inside (FM-12) | Hungary 1956 and Czechoslovakia 1968 show the label "counter-revolution" being used *against* democratic socialists. Kotz & Weir show the USSR dismantled by its own elite. Each needs different safeguards, and treating them as one encourages FM-02 | Yes |
| D-04 | Quotations only when checked against the linked text in this pass. Otherwise paraphrase or mark as unverified | The brief says "never invent quotes". Several famous lines (e.g. "they pretend to pay us") have uncertain origins | No. This is a working rule |
| D-05 | Contemporary Irish figures carry an "as of" date, with October 2026 the latest | Homelessness, the triple lock bill and polling change monthly | n/a |
| D-06 | The EU, the North and the party question are presented as options with trade-offs, not resolved | The brief says so explicitly, and the research shows each has a serious case on more than one side | n/a |

## Decisions made (Phase 1b — FM-16/17/18 and the options outline)

| # | Decision | Why | Reversible? |
|---|---|---|---|
| D-07 | FM-16 was rewritten around three positions (degrowth, eco-modernist socialism, Half-Earth). Its "What the literature suggests" section lists only the *common ground* (physical budgets, an independent ecological body, electrification first, public luxury, a just transition for farmers). The throughput disagreement is left for you | You asked for the debate, not a verdict. The common ground is real and is enough to design institutions | Yes |
| D-08 | Added FM-17 (legitimacy decay / "grey socialism") and FM-18 (social-reproduction failure), as requested. Total is now 18 | As requested. Both produced concrete mechanisms: privilege-free rationing, price formulas, design budgets; care counted in the plan, reserved parental leave, entrenched reproductive rights | Yes |
| D-09 | Included Kern & Hainmueller (2009) in FM-17 even though it cuts against a common left assumption | It is the best causal evidence on everyday legitimacy in the GDR. Leaving it out would be selective | n/a |
| D-10 | Proposed a ninth open question (Q9: the ecological commitment) | It came out of the FM-16 research and is a genuine choice. You can drop it | Yes — your call |
| D-11 | Scored options with `++ / + / 0 / − / −− / ?` and a reason for every cell, and did **not** total the scores | Totals would imply equal weights across failure modes, which is itself a value judgement you should make | Yes |
| D-12 | Irish names in the outline are marked provisional | I am not a reliable authority on Irish grammar; they need a fluent speaker's check | n/a |

## Choices I think you should make yourself

These are flagged in `research/SYNTHESIS.md` Part C and set out side by side, with scores and costs, in [`PHASE2-OUTLINE.md`](PHASE2-OUTLINE.md).

1. **The party question.** Vanguard with internal democracy / multi-party socialist pluralism / open pluralism including pro-capitalist parties / no-party councils.
2. **Entrenchment vs reversibility of social ownership.** How hard should a future majority find it to undo?
3. **The North.** 26 counties first / unity first / combined all-island convention / federal or confederal model.
4. **The EU.** Work within / negotiated derogations / exit / selective non-compliance.
5. **Binding sortition.** Do randomly selected bodies get binding powers (veto, agenda-setting) or stay advisory?
6. **Separation of powers vs Commune-style fusion** of legislature and executive.
7. **Market share of the consumer economy.** Nove-heavy ↔ parecon-heavy.
8. **Name and tone.** "Poblacht na nOibrithe" (Workers' Republic) is your working title. Is it final? A name centred on "workers" may affect how it reads to farmers, carers and people in the North. Worth considering.
9. **(Proposed) The ecological commitment.** Falling throughput / decarbonisation only / binding physical budgets with the mix left open / a Half-Earth land target.

## Decisions taken by the project owner (Phase 2)

These are the owner's answers to Q1–Q9 in [`PHASE2-OUTLINE.md`](PHASE2-OUTLINE.md). The owner's reasoning is used as the rationale text on the site; see [`decisions.json`](decisions.json). **Q1 and Q4 are switchable on the site**, with the owner's answer as the default.

| # | Question | Decision | Notes for implementation |
|---|---|---|---|
| D-13 | Q1 Party | **A leading socialist party with guaranteed internal democracy.** No open multi-party competition; pro-capitalist parties are not part of the post-transition order. Safeguards: <ul><li>factions and platforms legally protected (a reversal of the 1921 ban);</li><li>councils elect individuals, and non-party candidates can stand and win at every level;</li><li>no one may hold senior party office and senior state office at the same time;</li><li>party officials on a skilled worker's wage, with term limits and rotation;</li><li>no party command over security, courts or audit;</li><li>a sortition body audits the party's internal elections and finances.</li></ul> | The site must say this is the riskiest choice against FM-02 and FM-17 and show where the safeguards are thinnest. Switchable alternatives: Q1-B "several socialist parties" and Q1-D "councils with no parties" |
| D-14 | Q2 Entrenchment | **Hard, not impossible.** Core public ownership (housing stock, grid, water, health, rail) and core social rights change only by passage in two successive assemblies with an election in between, then a referendum. **An eternity clause covers democratic rights only:** elections, recall, a free press, independent courts and the sunset on emergency powers | The site states that entrenchment is a *secondary* defence; organised popular strength is the real guarantee (Weimar) |
| D-15 | Q3 North | **The 26 counties first, with a standing offer of an all-island constitutional convention.** No unity by imposition. The constitution states the convention offer and the principle of consent, not the outcome | FM-14 framing: Connolly's warning |
| D-16 | Q4 EU | **Stay; negotiate specific exemptions** (state aid, public procurement, public ownership of utilities); **publish fallback plans in advance** naming where the state would refuse to comply if talks fail, so any defiance is transparent and democratically mandated | Switchable alternatives: Q4-C "leave" and Q4-D "stay but defy", with their costs |
| D-17 | Q5 Sortition | **Binding, but in bounded areas:** auditing officials' pay and privileges (FM-01); approving any extension of emergency powers (FM-15); oversight of the security services (FM-04); the right to force a referendum. Ordinary law-making stays with elected, recallable delegates | |
| D-18 | Q6 Powers | **Executive elected by, and recallable at any time by, the assembly**, on a skilled worker's wage. **Courts, the audit office, the ecological authority and the public-media regulator stay independent** | A hybrid of Q6-B and Q6-C |
| D-19 | Q7 Markets | **Layered economy:** <ul><li>markets (mostly co-ops and small private firms) for most consumer goods and everyday services;</li><li>negotiated democratic planning for investment and the major sectors;</li><li>free or near-free public provision of housing, health, care, childcare, education, transport and energy basics;</li><li>an anti-insider rule: membership opens after probation, and use of non-member staff is capped.</li></ul> | |
| D-20 | Q8 Name | **The state stays "Éire / Ireland" (Art. 4).** The site's own title is the owner's creative decision; a placeholder is used for now | The placeholder is "[Site title]"; it lives in `content/site.json` |
| D-21 | Q9 Ecology | **The common-ground position:** <ul><li>binding physical limits enforced by an independent ecological authority with a veto over the plan;</li><li>a planned fall in material use in named wasteful sectors (data centres, aviation, advertising, the herd), with no growth target either way elsewhere;</li><li>degrowth never means austerity for working people;</li><li>the herd transition is planned and paid for, negotiated with farmers.</li></ul> | |
| D-22 | Sources page | Every work read only through reviews or abstracts is visibly badged on the public sources page | `content/bibliography.json` field `access` |

## Implementation decisions (Phase 2–3, mine)

| # | Decision | Why |
|---|---|---|
| D-23 | The site renders directly from `design/*.md|json`, `content/*` and `research/*.md`, using Vite raw and JSON imports. There is no separate content build step | The owner can edit text without touching code |
| D-24 | Switchable variants use `:::variant Q1=A` … `:::` blocks in Markdown, and `"variants": {"Q1": ["A"]}` on institutions, edges and scenario notes | One source of truth per variant; the default comes from `decisions.json` |
| D-25 | Map node positions are stored in `institutions.json` (`pos`), not computed by a layout engine | Deterministic and editable; no heavy graph library |
| D-26 | Hash routing and a relative base path | The built site works from any static host or straight from the file system |
| D-27 | Bilingual headings follow Irish road-sign convention: Irish in italic, English in roman. All Irish text is flagged as provisional | Fits the civic-signage brief; Irish text still needs a fluent speaker's review |
| D-28 | Executive form: a collective council of 7 with a rotating one-year chair (the Swiss model) inside the owner's "recallable by the assembly" rule | Q6 fixes recallability; collegiality adds FM-03 protection. **Owner may want to revisit** |
| D-29 | How Q1-A is written into the constitution (Arts. 30–33). <ul><li>The leading party is the only organisation that may put a *party label* on a ballot.</li><li>It gets **no** reserved seats, veto, power of appointment, or command over any organ of state.</li><li>Any citizen may stand as an individual.</li><li>Any association, including pro-market ones, may publish, assemble and campaign on issues; it may not run as an electoral party.</li></ul> | This is the narrowest reading of the owner's instruction "not open multi-party competition" that still keeps free speech and press under the eternity clause. The text says openly that this *is* a restriction on political association |
| D-30 | **Added by me:** a renewal referendum on the party's status every 10 years (Art. 33), which, if lost, moves the system to the Q1-B rules | The owner wants the party's authority to be earned, not granted by a clause. A periodic renewal makes that testable. **The owner may remove it.** It is shown on the site as a drafter's proposal |
| D-31 | Numbers in the constitution that are my judgement calls and that **the owner may wish to revisit**: <ul><li>pay ratio 1:4 inside social enterprises (Mondragon uses 1:6);</li><li>conversion to co-operative or social ownership above 50 employees;</li><li>workplace councils required from 20 employees;</li><li>National Assembly of 160 seats, elected by STV;</li><li>Citizens' Chamber of 120 members, half renewed each year;</li><li>recall petition at 20%;</li><li>a third of county capital budgets allocated by local assemblies;</li><li>emergencies capped at 30 days, extendable to 90 per year;</li><li>non-member staff in co-ops capped at 10%;</li><li>1% of public-service capital budgets for design and amenity.</li></ul> | Each needs a figure to be concrete. The figures follow precedents where they exist (Kerala's 35–40%; Ireland's 99-member assemblies; the Swiss 7-member council) and are otherwise reasoned guesses |
| D-32 | A National Assembly elected by STV, plus a Congress of Councils (workplace and county delegates) as a second, council-based channel, plus the Citizens' Chamber by lot | The brief asked for workplace → local/county → national, and for delegation vs representation. Soviet multi-tier indirect election distanced voters from power, so the council channel is a *second* channel alongside direct STV election, never the only one |
| D-33 | The President is kept: directly elected, a single 7-year term, ceremonial, with the power to refer Bills to the Constitutional Court | Continuity with the Article 26 reference power; no seat of power for a cult to grow around |
| D-34 | Family farms are protected from collectivisation without consent (Art. 5.3) | The disaster of forced collectivisation, and the fact that Ireland's Land Acts created a nation of smallholders. It is the precondition for the negotiated herd transition |
