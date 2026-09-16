# refactoring

A plugin for Claude Code that turns "refactor this module" into a plan the team can agree to before anyone touches code. Give it a module or folder, optionally where the code should end up, and optionally the problem that prompted it. It reads the module's git history and its code, and writes a numbered sequence of small, behaviour-preserving refactorings, each with what to do, why, how to check that nothing changed and how to undo it.

The plan is a document, not a diff. Nothing is refactored while planning.

## Install

```text
/plugin marketplace add anthara-ai/anthara-marketplace
/plugin install refactoring@anthara-marketplace
```

Start a new Claude Code session afterwards. For local development, from a checkout of this repository:

```bash
claude --plugin-dir ./refactoring
```

## Use

Run either command inside the repository that holds the module. The arguments are free text and work the same way for both: name the module by path or by name; add `into <folder or file>` if the code has a destination; add `because <problem>` if a particular change is what makes the refactoring worth doing. When a problem is given, the plan is ordered by what makes that change easy, and its headline measure is how many files the change touches before and after. Naming no module plans the current working directory. At the repository root that means the whole repository, and the hotspot table is what narrows the plan to the files worth touching.

### `/refactoring:plan`

```text
/refactoring:plan
/refactoring:plan src/assessment
/refactoring:plan assessment module into src/assessment/providers because it is very hard to change whenever we add a new SNOMED code provider
```

The plan is written to `docs/refactoring/<module-slug>-plan.md`. Open it in view mode: a summary block, a table of every step, the evidence with its numbers, the characterisation tests to add first, then the refactorings, each on one screen with what, why, catalogue name, where, sub-steps, check, dependencies, risk and a suggested commit message. Then the list of what is deliberately left alone, bugs found but not fixed, and questions for the team.

Each refactoring is one commit. Take them in order unless a step is marked independent; run the step's check; revert on red.

### `/refactoring:plan-to-html`

```text
/refactoring:plan-to-html src/assessment because adding a new SNOMED code provider takes four files
/refactoring:plan-to-html src/assessment for the CTO
```

It asks two things before it writes. It asks who the pitch is for, unless you already said, as in the second example above. The page ships in Anthara's theme, greens, amber, font and wordmark, so a page for an Anthara repository asks nothing about its look. For another company's repository it reads that brand from the repository's design tokens (a `globals.css`, a Tailwind config, a logo component), or asks once for the company's website, and changes five colour and font tokens and the wordmark, nothing else.

It writes the plan, then writes one self-contained HTML file at `docs/refactoring/<module-slug>-plan.for-<audience>.html` with two halves. The audience is in the filename because the same plan pitched to the team and to leadership is two different arguments over the same numbers, and both pages sit beside the markdown. The slides carry the argument to the audience you named: a page for the developers who will do the work leads with the shape of the change and where the danger is, and a page for whoever approves the time leads with the cost of leaving it alone. Each slide is a fixed canvas that scales to the window, steps with the arrow keys, and prints one per PDF page, so the same file opens in the meeting and attaches to the pull request. The appendix behind the slides carries the audit: every step in full, the hotspot and coupling tables, the contract, the safety net and the measures, as table cards that each name the plan section they come from and close with a caveat. Every file the page mentions links to the repository at the plan's commit, with the line range where the plan gives one, and every link is verified against the local clone before the page ships, so a skeptic can open what is being claimed. The numbers are the same for every audience and every one of them comes from the markdown plan. Everything is inline, so the file opens from disk, works with JavaScript off, and reflows on a phone.

## How it is built

Three skills. `plan` carries the method: where refactoring pays and where it does not, from Tornhill's hotspot and change-coupling analysis; the smells, catalogue refactorings and their mechanics, from Fowler; seams and characterisation tests for code with no tests, from Feathers. The git commands, the smell-to-refactoring map and the approach to testing legacy code live in `skills/plan/references/` and are read as needed.

`plan-to-html` runs `plan` and then argues the finished plan to a named audience. It reads only what the markdown plan already says, so no number appears on the page that a reader cannot find in the plan. The skill carries the rules that make a pitch honest, `skills/plan-to-html/references/audiences.md` carries one brief per room (the questions that audience walks in with, in order, what leads, which exhibits are drawn and which go to the appendix, and what the closing slide asks them to decide), `skills/plan-to-html/references/check-page.mjs` checks the finished page mechanically (unfilled slots, em dashes, external resources, dangling anchors, headings that join two claims, one-word or question column headers, semicolons, and the dependency diagram, including a panel with more than eight boxes or edges, boxes that collide and edges that run through a box they do not connect), `skills/plan-to-html/references/check-numbers.mjs` reports every number on the page that the markdown plan does not carry, `skills/plan-to-html/references/draw-shape.mjs` generates each panel of that diagram from a small spec of columns, rows and edges so that every edge is horizontal and vertical and every arrowhead is the same shape, `skills/plan/references/check-links.mjs` links every file mention to the repository at the plan's commit and verifies every link against the local clone (both skills run it, on the markdown and on the page), `agents/dependency-graph-verifier.md` is a separate agent that checks the drawn diagram against the code at that commit and against the plan's steps, edge by edge, until it can answer that the diagram is accurate, `agents/cold-reader.md` is a separate agent that reads the finished page once as the audience it was written for and reports every sentence that needed a second read, every term used before it was explained, and every sum on a slide that does not add up, once, and the skill applies its fixes without a second read (`skills/plan-to-html/references/page-text.mjs` gives it the page as reading-order text), and `skills/plan-to-html/references/deck-scaffold.html` carries the design system and the page mechanics: the tokens the theme sets, the components the slides and the appendix are composed from, the colour meanings, the chart rules, the heading and column-header rules, and the scaling, print and no-JavaScript behaviour. The scaffold fixes how the page looks and behaves so every pitch reads as the same firm's work. It fixes no slide list: the two documents are organised for different jobs, since the markdown is read in order by someone doing the work and the page is read once by a room deciding whether the work happens, so which slides exist and in what order is decided per plan and per audience.

`incubyte-writing-voice` is not a document. It is a byte-for-byte copy of the same skill in `mvp-spec`, and both `plan` and `plan-to-html` invoke it once per session and write in it.
