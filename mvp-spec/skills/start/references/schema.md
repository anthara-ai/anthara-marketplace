# Spec package schema

What an mvp-spec interview writes to disk. The interviewing skills read this file to know what to produce; Incubyte receives the zip it describes. How to *interview* for each document lives in the skills, not here.

## Layout

One flat folder. Files are numbered in reading order, which is also interview order and generation order.

```text
<product-slug>-spec/
├── 00 - Start Here.md
├── 01 - Business Context.md
├── 02 - Product Overview.md
├── 03 - Personas.md
├── 04 - User Journeys.md
├── 05 - Scope.md
├── 06 - Features and Acceptance Criteria.md
├── 07 - Data and Permissions.md
├── 08 - Platform, Integrations and Content.md
├── 09 - Rules and Compliance.md
├── 10 - Design Direction.md
├── 11 - Wireframes.md
├── 11.01 - Wireframe - <Screen Name>.html     one per screen with its states, journey order
├── 12 - Success Measures.md
├── 13 - Open Questions and Assumptions.md     append-mode
├── 14 - Glossary.md                           append-mode
├── 15 - Incubyte's Read.md                    Incubyte's view, written after 12
├── 15.01 - Research Notes.md                  interviewer's research notes with sources, append-mode
└── intake/                                    founder-supplied materials, untouched
```

Numbers are zero-padded so sorting survives past 09. Wireframes are `11.NN` files so they sort right after their index. `intake/` is the one subfolder: whatever the founder handed over, stored byte-for-byte, referenced from the documents but never edited.

## Progress

Documents are written in interview order, one at a time, and the founder reviews each file before the next is started. The first missing file in 01 to 12, then 15, is where a new session resumes. Files 13, 14 and 15.01 are appended to throughout. 15 is written after 12 and before packaging. 00 is written last, at packaging.

## The documents

| File | Holds |
|---|---|
| 00 Start Here | Orientation, product one-liner, document list, packaging date |
| 01 Business Context | Founder, team, stage, existing assets |
| 02 Product Overview | The anchor: problem, who it's for, day-one success |
| 03 Personas | Every user kind; buyer / user / operator map |
| 04 User Journeys | Per-persona narrative + Mermaid diagram; cross-persona handoffs; unhappy paths |
| 05 Scope | Inventory; must-have / good-to-have; what is in the first version; size line; non-goals; first-version replay |
| 06 Features and Acceptance Criteria | Per first-version feature: 2–4 plain done-means + unhappy paths |
| 07 Data and Permissions | The nouns; persona × noun matrix (see / edit / none); sensitive fields flagged |
| 08 Platform, Integrations and Content | Platform per persona; rented services; day-one content with owners |
| 09 Rules and Compliance | Sensitive data, consent, jurisdictions — flags, not legal advice |
| 10 Design Direction | Reference apps, five-second feeling, style pick, voice |
| 11 Wireframes | Screen index: screen → journey step → first-version feature → states → 11.NN file |
| 12 Success Measures | 3–5 measures and what the product must record for each |
| 13 Open Questions and Assumptions | Unknowns and assumptions with impact — the kickoff agenda |
| 14 Glossary | Founder's domain terms, their definitions |
| 15 Incubyte's Read | Product summary, elevator pitch, Incubyte's read on scope, comparable products with sources — Incubyte's opinion, and says so |
| 15.01 Research Notes | What the interviewer found about the domain and market, each note with its source and date — append-mode; research, not the founder's statements |

## Writing rules

- Plain language; any technical or domain term gets a row in 14.
- Complete, then as short as completeness allows: nothing missing that an engineer would need, nothing present that they would skip.
- Nothing invented: every statement traces to the founder; every unknown is a 13 row. "I don't know" is a valid answer.
- 15 and 15.01 are the only documents that may carry research or opinion, and each says so in its first line; everything in 01–14 traces to the founder.
- Diagrams are Mermaid. Wireframes are self-contained grayscale HTML — layout, flow and states only, never visual polish.

## Packaging

Before zipping, a consistency pass: personas ↔ journeys, first-version items ↔ acceptance criteria, wireframes ↔ journey steps and first-version features, screen count ↔ size line in 05, screen states ↔ unhappy paths in 06 and none cells in 07, sensitive fields in 07 ↔ flags in 09, every document 01–12 and 15 present, and nothing in 15 contradicts 01–14. Anything that disagrees is fixed with the founder before zipping.

The folder is zipped as `<product-slug>-spec-<YYYY-MM-DD>.zip` and sent to Incubyte — including `intake/`, 13, 15 and 15.01, because open questions, Incubyte's read and the research behind it are part of the deliverable.
