# mvp-spec

A plugin for Claude Cowork and Claude Code that interviews a startup founder and writes an estimable MVP spec package: personas, journeys, scope, acceptance criteria, data and permissions, compliance flags, design direction, lo-fi wireframes and success measures. The finished folder is zipped and sent to Incubyte.

The interview is worth the time for its own sake: it makes you decide things you had not yet decided, so by the end you understand your own product better than when you started and the spec is the byproduct. That understanding is also what lets Incubyte's engineers move quickly and build something that matches what you pictured.

## Install

The plugin works in both Claude Cowork and Claude Code. Install it in whichever you use.

### Claude Cowork

Plugins need a paid plan (Pro, Max, Team or Enterprise).

1. Open **Customize** in the sidebar, then the **Plugins** tab.
2. Select **Add marketplace** and enter `anthara-ai/anthara-marketplace`, or the full URL `https://github.com/anthara-ai/anthara-marketplace`.
3. Find **mvp-spec** among the plugins from that marketplace and click **Install**.
4. Open the installed plugin to see the skills it added. Nothing needs enabling by hand; there are no connectors or hooks to authorise. The only one you invoke yourself is **start**; the rest are steps it runs for you.

On an Enterprise plan an administrator may have to allow the marketplace first. Full details are in the [Cowork plugin docs](https://claude.com/docs/cowork/guide/plugins).

### Claude Code

You need [Claude Code](https://code.claude.com/docs/en/overview) installed and signed in. Then, inside Claude Code, add the Anthara marketplace once and install the plugin:

```text
/plugin marketplace add anthara-ai/anthara-marketplace
/plugin install mvp-spec@anthara-marketplace
```

Start a new Claude Code session afterwards so the skills load. To check they did, type `/mvp-spec:start` and it should offer to begin the interview.

For local development, from a checkout of this repository:

```bash
claude --plugin-dir ./mvp-spec
```

## Use

The interview is the same in Cowork and Code; only how you start it differs.

### First session

1. Start the interview by invoking the **start** skill:

   ```text
   /mvp-spec:start
   ```

   Saying what you want in your own words works too, for example "spec my product". Either way `start` is the skill that runs; it is the only one you invoke, both now and every time you come back.

   In **Cowork**, open a new task and run it there. The spec folder is created in the task's files.

   In **Code**, make an empty folder for the spec and start Claude Code inside it first:

   ```bash
   mkdir my-product-spec && cd my-product-spec
   claude
   ```

2. The interview asks for the product name and creates `<product-slug>-spec/`.
3. It asks for anything you already have: a pitch deck, notes, sketches, competitor screenshots, a Figma link. Give it file paths or links, or say you have nothing. Whatever you hand over is copied into `intake/` unchanged and read before any questions are asked.
4. It then works through the documents in order, one question at a time. Answer in plain language. "I don't know" is a fine answer; it gets recorded as an open question rather than guessed.
5. When a document is written, it tells you which file to open. Read the file, ask for any changes, and say **next** when you are happy with it. The next document does not start until you do.

### Stopping and resuming

Stop whenever you like; nothing is lost. Come back to the same Cowork task, or start Claude Code in the same folder again, and run `/mvp-spec:start` again (or say "continue my spec"). The same skill handles resuming: it picks up at the first document not yet written, after asking you to review the last one it wrote.

### Changing something earlier

Say what you want to change, for example "revisit personas" or "the parent should not see the child's journal". The relevant document is updated and you are asked to review the file again.

### Finishing

After the twelfth document you get `15 - Incubyte's Read.md`, written for you: a summary of the product, an elevator pitch, Incubyte's candid read on scope with the reasoning, and what public research shows about comparable products. Say next, or tell us what it changed. Then a consistency check runs across the whole package. Anything that disagrees is raised with you and fixed before packaging. Then `00 - Start Here.md` is written for the engineers who will read the package, and everything is zipped as `<product-slug>-spec-<YYYY-MM-DD>.zip` beside the spec folder. Send that zip to Incubyte.

## What it produces

One flat folder, `<product-slug>-spec/`, with numbered documents `00` to `15`, one HTML wireframe per screen, and an `intake/` folder holding whatever the founder handed over, untouched. Documents are written in order and the founder reviews each file before the next is started. The full layout and rules are in `skills/start/references/schema.md`.

When every document is written, a consistency pass runs across the package, `00 - Start Here.md` is written for the receiving engineers, and the folder is zipped as `<product-slug>-spec-<YYYY-MM-DD>.zip`.

## How it is built

`skills/start` is the orchestrator and the only skill a founder invokes: it owns the spec folder, the intake step, the interview rules and the hand-off between documents. Each numbered document has its own skill under `skills/` that says what the finished file contains, where founders reliably go wrong, and what done looks like. The skills give guidance, not scripts: the interviewer treats the spec as a tree, follows each answer into the questions that hang off it, and stops when an engineer could build from the document and the founder would recognise it as theirs.

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
| 15 Incubyte's Read | `report` |
| 00 Start Here, consistency pass, zip | `package` |

Files 13 (Open Questions and Assumptions) and 14 (Glossary) are appended to by every phase and never block progress.
