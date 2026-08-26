# mvp-spec

A Claude Code plugin that interviews a startup founder and writes an estimable MVP spec package: personas, journeys, scope, acceptance criteria, data and permissions, compliance flags, design direction, lo-fi wireframes and success measures. The finished folder is zipped and sent to Incubyte, whose engineers estimate and build from it without talking to the founder first.

## Install

From the Anthara marketplace:

```text
/plugin marketplace add anthara-ai/anthara-marketplace
/plugin install mvp-spec@anthara-marketplace
```

For local development, from this repository's root:

```bash
claude --plugin-dir ./mvp-spec
```

## Use

Start Claude Code in the directory where the spec folder should live and say what you want in your own words, for example "spec my product" or "continue my spec", or run `/mvp-spec:mvp-spec`.

The interview asks one question at a time, asks for any existing materials first (deck, sketches, competitor screenshots), and writes one document at a time. Review each file and say next to move on. Close the terminal whenever you like; the next session picks up at the first document not yet written.

## What it produces

One flat folder, `<product-slug>-spec/`, with numbered documents `00` to `14`, one HTML wireframe per screen, and an `intake/` folder holding whatever the founder handed over, untouched. Documents are written in order and the founder reviews each file before the next is started. The full layout and rules are in `skills/mvp-spec/references/schema.md`.

When every document is written, a consistency pass runs across the package, `00 - Start Here.md` is written for the receiving engineers, and the folder is zipped as `<product-slug>-spec-<YYYY-MM-DD>.zip`.

## How it is built

`skills/mvp-spec` is the orchestrator: it owns the spec folder, the intake step, the interview rules and the hand-off between documents. Each numbered document has its own skill under `skills/` that says what the document must answer, where founders reliably go wrong, and what to check before offering to move on. The phase skills give guidance, not scripts; the interviewer decides what to ask and in which order within a phase.

| Document | Skill |
|---|---|
| 01 Business Context | `business-context` |
| 02 Product Overview | `product-overview` |
| 03 Personas | `personas` |
| 04 User Journeys | `user-journeys` |
| 05 Scope | `scope` |
| 06 Features and Acceptance Criteria | `features` |
| 07 Data and Permissions | `data-and-permissions` |
| 08 Platform, Integrations and Content | `platform` |
| 09 Rules and Compliance | `compliance` |
| 10 Design Direction | `design-direction` |
| 11 Wireframes | `wireframes` |
| 12 Success Measures | `success-measures` |
| 00 Start Here, consistency pass, zip | `package` |

Files 13 (Open Questions and Assumptions) and 14 (Glossary) are appended to by every phase and never block progress.
