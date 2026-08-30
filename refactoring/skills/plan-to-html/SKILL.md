---
name: plan-to-html
description: "This skill should be used when a developer asks to \"present the refactoring plan\", \"make the plan a web page\", \"turn the refactoring plan into HTML\", \"build slides for the refactoring\", \"show the team why we should refactor this\", or invokes /refactoring:plan-to-html with a module or folder name, an optional target location and an optional problem statement. With no module given it plans the current working directory. It runs the `plan` skill and then renders the plan as one self-contained HTML page whose visuals show why this module should be refactored before anything else and what the plan wins."
argument-hint: "[module or folder] [into <target folder or file>] [because <problem statement>]"
---

# Refactoring plan as a web page

Write `docs/refactoring/<module-slug>-plan.html`: the refactoring plan as one self-contained page, with charts that answer the two questions a team asks in the meeting. Why this module before anything else, and what do we get for the work. The markdown plan stays the document a developer works from. This page is the document a team decides from.

The page changes no code and adds no analysis. Every number on it comes from the markdown plan.

## Order of work

1. **The voice.** Invoke `refactoring:incubyte-writing-voice` and write every sentence on the page in that voice, since the page is read outside the team that wrote it. It governs how sentences are built. Where it and anything here disagree on that, it wins. Invoke it once per session.

2. **Get the plan.** Invoke the `refactoring:plan` skill with `$ARGUMENTS` unchanged and let it finish. One exception: when `docs/refactoring/<module-slug>-plan.md` already exists and the commit hash in its summary block equals the current `git rev-parse --short HEAD`, ask in one line whether to render that plan or re-run the analysis, and render it when the developer says nothing specific. A plan written at a different hash is stale, so re-run the analysis rather than rendering it silently.

3. **Read the plan and pull its numbers.** The hotspot table, the coupling shares, the measures table, the step table with its phases, the safety net, the leave-alone list, the bugs, the questions and the dependency diagrams. Compute nothing new and invent nothing. Where a chart needs a number the plan does not carry, that item on the chart reads "not measured" and the gap goes into the "What this page could not show" list at the end of the page.

4. **Write the page.** Fill `${CLAUDE_PLUGIN_ROOT}/skills/plan-to-html/references/template.html` and write the result to `docs/refactoring/<module-slug>-plan.html`. Inline CSS and inline script only, inline SVG for every visual, no external resource of any kind, so the file opens from disk, attaches to a pull request and pastes into a wiki. The template carries the stylesheet, the print stylesheet, the section scaffold and one commented example of each SVG pattern.

5. **Verify.** Open the page in a browser if one is available, Claude in Chrome or the equivalent: check that every chart draws, that no text overlaps a mark, that the collapsibles open, and that nothing runs off the page at laptop width. If no browser is available, check the code instead: tags balance, every anchor in the table of contents resolves to an id on the page, every SVG has a `<title>`, every chart's numbers also appear in text nearby, and nothing loads from outside the file. Never stall on verification. Tell the developer in one line which method ran.

6. **Then.** Tell the developer both paths, the markdown and the HTML, and that nothing in the code has changed. Suggest opening the HTML in the team meeting and the markdown when doing the work.

## What the page shows

Restrained on purpose. One accent colour for what the plan targets and for the "after" number, grey for what is left alone and for the "before" number, and nothing else. This is a document for a meeting, not a dashboard. Every chart carries an SVG `<title>`, and the numbers behind every chart appear in text beside it, because a chart is a summary of a table and never a substitute for one. Script does the collapsibles and nothing else, so the page reads whole with JavaScript switched off.

- **The headline.** The module, the problem statement in the developer's words, the one-line diagnosis, and the single headline measure as a large before and after pair, such as adding a provider touching seven files today and one after the plan. The commit hash and the history window sit under it in small text, because numbers without a hash cannot be reproduced.

- **Why this module, and why now.** A hotspot quadrant, drawn as a scatter with change frequency on the x axis and complexity on the y axis, saying in the axis label whether the complexity is lines or deep lines. One dot per file from the hotspot table, files in the plan in the accent colour and labelled with their R-numbers, files left alone in grey. Under it, a paragraph saying that technical debt only costs interest where the code changes, which is why the plan spends its effort in the top-right quadrant and leaves the rest alone. Beside it, a horizontal bar chart of change coupling, one bar per outside file as a share of the module's commits, with the one-third line marked and a sentence saying that a file above that line is changing for the module's reasons rather than its own. The hotspot table itself follows the charts.

- **Why in this order.** A phased timeline with four swim lanes left to right in execution order: seam, characterisation test, refactoring, public surface. One box per step, numbered R1 and T1 onwards, arrows for what a step depends on, and independent steps drawn so that two developers can see at a glance what they can take at the same time. A step that runs blind carries a visible marker. Under it, the reason for the order: seams come first because the tests need somewhere to attach, tests come before the refactorings they protect, and the public surface comes last because it is the only part callers see.

- **What the plan wins.** The measures table drawn as paired before and after bars, one pair per measure, with both numbers printed beside the bars, followed by the table itself. Below that, the before and after dependency diagrams side by side, translated from the plan's Mermaid into inline SVG boxes and arrows and kept simple. One sentence under each diagram saying what changed, naming the arrow that disappeared or the files that merged.

- **The steps.** A risk by coverage matrix first, four counts across low and medium risk by covered and blind, with a sentence naming the cell the team should review hardest. Then the full step table. Then one collapsible `<details>` block per refactoring carrying What, Why, Catalogue, Where, Steps, Check, Depends on, Risk and Commit, copied faithfully from the markdown.

- **The rest**, straight from the markdown and formatted: the safety net with the characterisation tests, the leave-alone list with its reasons, the bugs found but not fixed, the questions for the team, and Done when.

- **What this page could not show**, listing anything the plan did not carry a number for. Leave the section out when there is nothing in it.

## Where this goes wrong

- **A number appears on the page that is not in the plan.** Every figure is traceable to the markdown, and the page says "not measured" rather than filling a gap.
- **The page loads something.** A font, a chart library, an icon. It then breaks the moment it is attached to a pull request or opened offline.
- **Colour is used for decoration.** A second and third colour makes the reader hunt for a meaning that is not there. One accent, one grey.
- **A chart replaces its table.** Someone in the meeting will ask for the number. Put it beside the chart.
- **The markdown and the page disagree.** They are written from the same run at the same hash. Re-run both rather than editing one.

## Done when

The HTML file exists beside the markdown plan and opens from disk with no network. Every chart draws, carries a `<title>`, and has its numbers in text beside it. Every step in the markdown appears in the step table and in a collapsible block. The measures table, the hotspot table, the leave-alone list, the bugs and the questions all made it across. The page prints to a readable deck. A team member who has never opened the module could read the first screen and say why this module comes first.
