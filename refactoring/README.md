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

Run it inside the repository that holds the module:

```text
/refactoring:plan
/refactoring:plan src/assessment
/refactoring:plan assessment module into src/assessment/providers because it is very hard to change whenever we add a new SNOMED code provider
/refactoring:plan-to-html src/assessment because adding a new SNOMED code provider takes four files
```

The arguments are free text. Name the module by path or by name; add `into <folder or file>` if the code has a destination; add `because <problem>` if a particular change is what makes the refactoring worth doing. When a problem is given, the plan is ordered by what makes that change easy, and its headline measure is how many files the change touches before and after.

Naming no module plans the current working directory. At the repository root that means the whole repository, and the hotspot table is what narrows the plan to the files worth touching.

`/refactoring:plan-to-html` takes the same arguments. It writes the plan, then renders it as one self-contained HTML page at `docs/refactoring/<module-slug>-plan.html`. The page opens the case for the module: the headline measure as a before and after pair, a hotspot quadrant showing which files are both complex and changed often, the change coupling that crosses the one-third line, a phased timeline showing why the steps come in the order they do, and paired bars for every measure the plan promises to move. Everything is inline, so the file opens from disk, attaches to a pull request and prints to a readable deck.

The plan is written to `docs/refactoring/<module-slug>-plan.md`. Open it in view mode: a summary block, a table of every step, the evidence with its numbers, the characterisation tests to add first, then the refactorings, each on one screen with what, why, catalogue name, where, sub-steps, check, dependencies, risk and a suggested commit message. Then the list of what is deliberately left alone, bugs found but not fixed, and questions for the team.

Each refactoring is one commit. Take them in order unless a step is marked independent; run the step's check; revert on red.

## How it is built

Three skills. `plan` carries the method: where refactoring pays and where it does not, from Tornhill's hotspot and change-coupling analysis; the smells, catalogue refactorings and their mechanics, from Fowler; seams and characterisation tests for code with no tests, from Feathers. The git commands, the smell-to-refactoring map and the approach to testing legacy code live in `skills/plan/references/` and are read as needed.

`plan-to-html` runs `plan` and then renders the finished plan as a web page. It reads only what the markdown plan already says, so no number appears on the page that a reader cannot find in the plan. Its `references/template.html` holds the stylesheet, the print stylesheet and one example of each chart, which keeps the output consistent from run to run.

`incubyte-writing-voice` is not a document. It is a byte-for-byte copy of the same skill in `mvp-spec`, and both `plan` and `plan-to-html` invoke it once per session and write in it.
