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

It asks two things before it writes. It asks who the pitch is for, unless you already said, as in the second example above. It also asks once for the company's website, and if you give one, pulls its background, text and accent colours and its font so the page reads as that company's document rather than a generic one. Say no or give nothing and it renders in its own restrained default.

It writes the plan, then writes one self-contained HTML page at `docs/refactoring/<module-slug>-plan.html` that argues the case to the audience you named. A page for the developers who will do the work leads with the shape of the change and where the danger is. A page for whoever approves the time leads with the cost of leaving it alone. The numbers are the same either way and every one of them comes from the markdown plan. Everything is inline, so the file opens from disk, attaches to a pull request and prints to a readable deck.

## How it is built

Three skills. `plan` carries the method: where refactoring pays and where it does not, from Tornhill's hotspot and change-coupling analysis; the smells, catalogue refactorings and their mechanics, from Fowler; seams and characterisation tests for code with no tests, from Feathers. The git commands, the smell-to-refactoring map and the approach to testing legacy code live in `skills/plan/references/` and are read as needed.

`plan-to-html` runs `plan` and then argues the finished plan to a named audience. It reads only what the markdown plan already says, so no number appears on the page that a reader cannot find in the plan. There is no page template. The two documents are organised for different jobs, since the markdown is read in order by someone doing the work and the page is read once by a room deciding whether the work happens, so the skill carries the rules that make a pitch honest and leaves the shape of each page to the plan and the audience in front of it.

`incubyte-writing-voice` is not a document. It is a byte-for-byte copy of the same skill in `mvp-spec`, and both `plan` and `plan-to-html` invoke it once per session and write in it.
