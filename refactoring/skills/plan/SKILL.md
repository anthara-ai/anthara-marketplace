---
name: plan
description: "This skill should be used when a developer asks to \"plan a refactoring\", \"refactor this module\", \"make <module> easier to change\", \"write a refactoring plan\", \"how would we refactor <folder>\", or invokes /refactoring:plan with a module or folder name, an optional target location and an optional problem statement such as \"because adding a new provider is hard\". It investigates the module through its git history and its code and writes a numbered, step-by-step, behaviour-preserving refactoring plan that one developer can execute a step at a time and present to their team."
argument-hint: "<module or folder> [into <target folder or file>] [because <problem statement>]"
---

# Refactoring plan

Take a module and write `docs/refactoring/<module-slug>-plan.md`: a plan that changes no behaviour and leaves the module easier to change. The plan is a numbered sequence of small refactorings, each with what to do, why, how to check that nothing changed and how to undo it, so that one developer can take one step on a quiet afternoon, and the whole team can read the file in view mode and agree to it before anyone touches code.

The plan is a document, not a diff. Nothing is refactored while planning; if asked to start on a step, finish and hand over the plan first.

The method is borrowed and named, so the team can look it up. Hotspots, change coupling and code age come from Tornhill's *Your Code as a Crime Scene* and *Software Design X-Rays*, which say where refactoring pays and where it does not. The smells, the catalogue of refactorings and their mechanics come from Fowler's *Refactoring*. Seams and characterisation tests come from Feathers' *Working Effectively with Legacy Code*, for when there is no test to lean on.

## Reading the arguments

`$ARGUMENTS` is free text. Find three things in it.

- **The module.** A path, or a name to resolve. Search the repository for it; when more than one thing could be meant, ask which, and never guess. When the arguments name nothing, ask for the module and nothing else; the code and its history answer the rest.
- **A target**, optional: "into `src/providers/`", a folder or file the code should end up in. Look at what is already there and at how the neighbouring modules are shaped; the target has to fit the repository's conventions, not the plan's.
- **A problem statement**, optional: the pain that prompted this, however it is phrased. "Because it's very hard to change whenever I want to add a new SNOMED code provider" is one. Keep it in the developer's own words at the top of the plan.

## One hat

Fowler's rule: refactoring or adding function, never both in one change. The plan refactors. It fixes no bugs, adds no feature, tunes no performance and reformats no line a step does not otherwise touch, because formatting churn hides behaviour changes in a diff. Bugs found on the way are written down in the plan, not fixed; fixing one changes behaviour, which is the thing this plan promises not to do. When the problem statement is itself a feature, the plan makes that feature easy to add and stops there.

## The problem statement decides the order

When a problem statement is given, this is preparatory refactoring: make the change easy, then make the easy change. Find the change it describes in the code as it is today. Trace every file, function and test a developer would have to touch to make it, and count them. That trace is the plan's headline evidence, and the count is its headline measure: adding a provider touches seven files in four folders today, and after the plan it touches one. Order the steps by what shortens that path. Hygiene the path does not need goes to the end or to the leave-alone list.

When there is no problem statement, order by interest: hotspots first, because that is where the debt is being paid.

## Investigate before writing

Eight things, in this order. Each one leaves numbers in the plan, so the team can argue with data rather than taste.

1. **Draw the contract.** Every export, every caller found by searching the imports, and every entry point that is not code: routes, dependency injection registrations, scheduled jobs, CLI wiring, configuration keys, serialised shapes and database schema. Treat the list as a published API: identical afterwards unless the developer has explicitly put a caller change in scope.
2. **Run the forensics.** Change frequency per file from the history, complexity from the code, and the two together: a hotspot is a file high on both. Then change coupling, code age and who holds the knowledge. The commands, and how to read what they return, are in `references/forensics.md`. The principle behind them: technical debt only costs interest where the code changes, so a complex file nobody has touched in two years is a curiosity, and a moderately tangled file touched every week is the target.
3. **X-ray the hot files.** Inside each hotspot, which functions carry the churn and the depth. Those are the targets; the rest of the file is territory the plan leaves alone and says so. Check the complexity trend too, because a hotspot still getting worse is a stronger case than one that has plateaued.
4. **Name the smells, with line numbers.** Fowler's vocabulary, so the team can look each one up: Long Function, Large Class, Divergent Change, Shotgun Surgery, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Message Chains, Global Data, Mutable Data, Mysterious Name, Duplicated Code, Speculative Generality. Cross each smell with the forensics. A smell inside a hotspot, or on the problem statement's path, is debt to pay. The same smell in cold code is a note in the plan, not a step. `references/catalogue.md` maps smell to refactoring and says when to leave a smell alone.
5. **Measure the safety net.** Find the tests that cover the module and run them. Map each behaviour in the contract to the test that pins it, and record the baseline: green, timings, anything flaky. Where the net is thin or absent, which is usual in the code that most needs this, `references/testing-without-tests.md` says how to build one at whatever boundary can be reached, and what that does to the order of the plan. Before trusting any net, break one line deliberately and confirm it goes red.
6. **Decide the target shape from the coupling data.** Things that change together live together; dependencies point one way; the contract from step 1 is unchanged. Check the shape against a module in the same repository that already does it well, and against the target folder if one was given. A shape drawn from a pattern the author likes, rather than from a coupling row, is the most common way a plan goes wrong.
7. **Write the steps.** For each smell that made the cut, the smallest catalogue refactoring that removes it, with the mechanics Fowler publishes for it. A refactoring that cannot be one commit with a green check afterwards is split into numbered sub-steps that can. Order: seam-creating steps first, because the tests need them; then the characterisation tests; then the steps that improve the module, leaves before callers, renames and extracts before moves, and anything touching the public surface last.
8. **Write the leave-alone list, with reasons.** Cold, stable code carries no interest. Ugly code behind an interface nobody needs to change is, in Fowler's words, code to leave. Anything that reflection, serialisation or the schema reaches for is invisible to the tests. Anything with no seam and no way to pin its behaviour carries more risk in the touching than benefit in the result. And when a problem statement was given, anything off its path.

## What the plan contains

One markdown file, written to be read in view mode and put on a screen in front of the team. Headings, tables and Mermaid diagrams; numbers in the text where an adjective would otherwise go; each refactoring fits on one screen.

- **A summary block at the top.** The module, the problem statement in the developer's words, a one-line diagnosis, a one-line description of the shape afterwards, how many tests and refactorings follow, and the commit hash and history window the analysis was run on, because numbers without a hash cannot be reproduced or known to have gone stale. Two more lines: the stop rule, that any red means revert the step rather than fix forward; and what is out of scope, which is features, bug fixes, performance and reformatting.
- **How to use this plan.** A short paragraph for the team: one refactoring is one commit or one pull request; take them in the order given unless a step is marked independent; run the step's check before and after; revert on red. A pull request can say "R3" and everyone knows what it means.
- **A table of every step.** Number, title, catalogue name, what it depends on, risk, and whether a test covers it or it runs blind. This is the slide the team looks at longest.
- **The evidence.** The contract. The hotspot table with the numbers. The change-coupling findings, both the outside files that travel with the module and the inside files that never travel together. Code age and knowledge. The problem statement's trace through the code as it is today. A before-and-after dependency diagram in Mermaid.
- **The safety net.** What exists and its state. Then the characterisation tests to add, numbered T1 onwards, each naming the behaviour it pins and the boundary it drives it from. Then which refactorings run without a net, marked plainly.
- **The refactorings, numbered R1 onwards.** Each under its own heading, named for what moves: "R3. Extract `parseCodes` from `AssessmentService`". Each carries: **What**, in two or three sentences. **Why**: the smell, the evidence row that motivates it, and how it shortens the problem statement's path. **Catalogue**: the refactoring's published name, so the mechanics can be looked up. **Where**: files and line ranges. **Steps**: when the refactoring is more than one commit, numbered sub-steps R3.1, R3.2 and so on following the published mechanics, each with its own check. **Check**: the tests and the diffs that prove nothing changed. **Depends on**: earlier steps by number, or "independent", which is what lets two developers take two steps at once. **Risk**: low or medium, with the reason, such as touching the public surface or a side effect. **Commit**: a suggested message, so the history reads like the plan.
- **The leave-alone list**, each item with its reason.
- **Bugs found, not fixed**: where, and what looks wrong, for the team to ticket separately.
- **Questions for the team**: whatever the plan could not settle from the code, such as whether an export is used outside the repository, whether a name can change, who owns a file whose last author has left.
- **Done when.** The export list and the golden outputs diff clean, the tests are green, and the numbers have moved: the longest function from 240 lines to under 40, the coupling with a named file gone, the problem statement's touch count from seven to one. A date to re-run the forensics and see whether the hotspot stayed cool.

## Where plans go wrong

- **They refactor cold code because it is ugly.** Ugliness is not a reason; interest is. Every step points at a hotspot row, a coupling row or the problem statement's path, or it is not a step.
- **Steps are too big.** "Extract the provider service" is a project, not a refactoring. If a step cannot be one commit with a green check, split it until it can.
- **The target shape comes from taste.** A layering the author likes, a pattern from another codebase. The shape comes from what changes together and from what the repository already does well.
- **"While I'm here."** A bug fixed, a name improved in a file the step does not otherwise touch, a dependency bumped. Each is a behaviour change or a diff nobody can review. Record it; do not do it.
- **The net never went red.** A characterisation test that passes on the first run and was never made to fail proves nothing. Break the code once, on purpose, and watch.
- **History is taken at face value.** Squash merges hide granularity, a repository-wide formatting commit inflates every file's frequency, a rename resets a file's age. State the window, exclude the noise commits by name, follow renames.
- **The steps add up to a rewrite.** When the plan's refactorings, taken together, replace most of the module, say so at the top and stop. A rewrite is a different decision, made by the team, with different risks.

## Done when

The plan file exists. Every refactoring has what, why, catalogue name, where, check, dependencies and risk; every one bigger than a commit has sub-steps; every one points at a piece of evidence. The characterisation tests come before the refactorings that need them, and the seam-creating steps before the tests. The leave-alone list gives a reason per item. The summary's numbers can be reproduced from the stated hash. A developer who has never opened the module could pick R1, know what to do, and know how to tell that they did it without changing anything.

## Then

Tell the developer where the plan is and that nothing in the code has changed. Suggest reading the summary and the evidence with the team before anyone starts R1. Offer to re-run the forensics after the work is done to see whether the hotspot cooled. If asked to carry out a step, do exactly one, run its check, and stop.
