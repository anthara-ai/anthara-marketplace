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
/refactoring:plan src/assessment
/refactoring:plan assessment module into src/assessment/providers because it is very hard to change whenever we add a new SNOMED code provider
```

The arguments are free text. Name the module by path or by name; add `into <folder or file>` if the code has a destination; add `because <problem>` if a particular change is what makes the refactoring worth doing. When a problem is given, the plan is ordered by what makes that change easy, and its headline measure is how many files the change touches before and after.

The plan is written to `docs/refactoring/<module-slug>-plan.md`. Open it in view mode: a summary block, a table of every step, the evidence with its numbers, the characterisation tests to add first, then the refactorings, each on one screen with what, why, catalogue name, where, sub-steps, check, dependencies, risk and a suggested commit message. Then the list of what is deliberately left alone, bugs found but not fixed, and questions for the team.

Each refactoring is one commit. Take them in order unless a step is marked independent; run the step's check; revert on red.

## How it is built

One skill, `plan`. It carries the method: where refactoring pays and where it does not, from Tornhill's hotspot and change-coupling analysis; the smells, catalogue refactorings and their mechanics, from Fowler; seams and characterisation tests for code with no tests, from Feathers. The git commands, the smell-to-refactoring map and the approach to testing legacy code live in `skills/plan/references/` and are read as needed.
