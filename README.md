# [Site title] — a constitutional design for a democratic socialist Ireland

An interactive, static website setting out a complete governmental and economic design for a democratic socialist republic in Ireland. Every institution is built against a named failure mode of twentieth-century socialist states, and every institution states its residual risk and the strongest critique of it.

> The site's own title is a placeholder. Set it in `content/site.json`.

## Run it

```bash
npm install
npm run dev        # local dev server with live reload
npm run build      # static build in dist/
npm test           # after a build: smoke + accessibility (axe), variant switching, keyboard tests
```

The build is plain static files with relative paths and hash routing. Upload `dist/` to any static host (GitHub Pages, Netlify, a web server), or open it from a local web server. There is no backend.

## Editing the text: no code needed

All content lives in Markdown and JSON. Change a file, then rebuild (or keep `npm run dev` running).

| What | File | Notes |
|---|---|---|
| Site title, subtitle, footer | `content/site.json` | |
| Overview page | `content/overview.md` | |
| Open questions page | `content/open-questions.md` | |
| **The constitution** | `design/constitution.md` | See the conventions below |
| **Institutions on the map** | `design/institutions.json` | Nodes (text, `pos` coordinates, safeguards) and edges (`kind` drives the overlays) |
| Failure modes (summaries) | `design/failure-modes.json` | Full text in `research/SYNTHESIS.md` |
| Design choices and the switchable alternatives | `design/decisions.json` | `default` is the chosen option for Q1 and Q4 |
| Stress tests | `content/scenarios/*.json` | One file per scenario; steps with `next` or `choices` |
| A day in the republic | `content/vignettes/*.md` | Front matter: `title`, `title_ga`, `who`, `place`, `fms`, `order` |
| Key works and how they were read | `content/bibliography.json` | `access`: `primary`, `secondary`, `abstract` or `reviews` |
| Research notes | `research/*.md` | Rendered on the site under Sources; every external link is listed automatically |

### Conventions inside the text

- **Failure modes.** Writing `FM-07` anywhere links it to that failure mode's page.
- **Institutions.** In vignettes and scenarios, `[[care-service|National Care Service]]` links to that body on the map.
- **Research links.** `[note](research/09-ecology-and-growth.md)` opens the research note inside the site.
- **Constitution annotations.** A blockquote starting with `> **Why.**` renders as a margin note.
- **Entrenchment tier.** Add `{eternal}`, `{core}` or `{standard}` at the end of an article heading.
- **Switchable text.** Wrap text in `:::variant Q1=A` … `:::` (or `Q1=B,D`, `Q4=C`). It shows only when the reader has that option selected. In JSON, the same idea is `"variants": {"Q1": ["A"]}` on map nodes and edges, and `"alt_notes": {"Q4=C": "…"}` on scenario steps.

## Project structure

```
research/   Phase 1: sourced research notes and SYNTHESIS.md (18 failure modes)
design/     Phase 2: constitution, institutions, decisions, decision log, options outline
content/    Site pages, scenarios, vignettes, bibliography
src/        The site (Vite + vanilla JS): pages/, lib/, styles/
tests/      Playwright smoke + axe, variant and keyboard checks; shot.mjs screenshot helper
```

## Honesty notes

- Every claim in `research/` links to a source. Works read only through reviews or abstracts are marked on the Sources page.
- **The Irish-language text is provisional** and needs a fluent speaker's review.
- **The constitution is a design document**, not a legal text. It has not been reviewed by lawyers.
- Design decisions, and the ones the project owner made, are logged in `design/DECISIONS.md`.
