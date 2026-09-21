# Who the pitch is for

The page is built as answers to the questions one audience walks in with, in the order they ask them. That is what stops it turning into the markdown plan with headings. Pick the brief for the audience the developer named, write the argument outline from its questions, and only then open the scaffold.

Every brief draws on the same plan and the same numbers. What changes is which questions get a slide, what leads, which exhibits are drawn, what vocabulary the headings use, and what the closing slide asks the room to decide. An exhibit an audience did not ask for goes to the appendix, however good it looks.

The plan carries the material for every question below. Where a question has no answer in the plan, the brief says so, and the page says so in place rather than routing around it.

## My team

The developers who will do the work. The codebase is familiar, so there is no orientation and no business framing. They have watched a refactoring go wrong before and want to know where this one could.

Questions, in order:

1. **What does it look like afterwards?** The plan's before-and-after dependency shape, drawn on the grid. This is the one audience for whom the diagram leads. When the plan changes no dependency between modules, this slot is the X-ray of the hot file instead, functions by churn and depth, today and after.
2. **Where will I break something?** The steps rated medium, the steps that run blind, and what pins each one. The riskiest step gets one screen with its what, why, check and undo.
3. **What do I do first, and what can we take in parallel?** The step table, all of it, with phase, dependency, risk and net. Independent steps called out, since two developers can take two at once.
4. **What are we deliberately not touching, and why?** The leave-alone list, because a developer who sees ugly code nearby will otherwise fix it "while they are here".
5. **What do we need to settle before the first commit?** The plan's questions for the team that a developer can answer: names, whether an export is used elsewhere, who reviews a file whose author has left.

Leads with the after-shape. Vocabulary is fully technical: file names, function names, catalogue names, test ids. Every box in the shape diagram stands for a path this room can open with a click, the legend under each panel names that path and every file behind a group box, and a set of files in prose is always written out in full, never "and two others". The hotspot trend and the business cost are appendix material, since this room already knows the file is painful. Closing decision: who takes which independent step this sprint, and agreement on the names the plan proposes.

Usually five or six slides.

## Tech lead or engineering manager

The person who approves the time. They are protective of the roadmap and have to defend the decision to someone else. They will read the first screen and the last, and skim the middle.

Questions, in order:

1. **What is this costing us today?** Pain already felt, never a hypothetical. When the plan traces a routine change, lead with the last time the team made that change and what it cost them, with the commits and dates from the plan. A future change nobody has scheduled does not move this reader. The number is usually the touch count or the file's growth.
2. **Why now rather than next quarter?** The trend from the hotspot table. When a cleanup was undone, say how quickly, because that is the deferral cost in the plan's own numbers.
3. **Will it spill?** One slide. The fastest proof is the after-shape drawn small with everything that already exists in grey and only what the plan adds in accent, so the reader sees the controller and the services untouched without reading a list. Under it, the contract counts in one line (exports, routes, shapes, schema, all identical) and the safety net in three numbers: tests today, characterisation tests first, steps rated medium. The unproven net, when it is unproven, is one footnote and never buried.
4. **What does it cost, and when does it land?** A refactoring plan carries no estimate in engineer days, because nothing in a git history supports one. Say so. Then give what the plan does carry: the commit count, and a schedule derived from the dependency lines, which is usually a first phase of independent steps that fit one sprint and a second phase that is a strict chain. What the work competes with is not in the plan either, so put it to the room as a question rather than pretend to answer it.
5. **What are you asking me to decide?** Approve the first phase. Name the reviewer. Say what this displaces.

Leads with the felt cost. Vocabulary is technical but light: file names are fine, catalogue names are not needed, and a step is described by what it does rather than by its Fowler name. The after-shape is the spill slide's exhibit, with its legend under it so the lead can check which files sit behind "the controller and the services" without opening the appendix, and both panels, today and after, are in the appendix with their legends. The step table, the duplication measurements and the hotspot table are appendix material.

Load budget for this reader: one exhibit per slide, no more than three cards beside it, and no card that restates what the exhibit already shows. If a slide needs a bulleted list to make its point, the point is not yet one claim.

Usually five slides.

## Leadership or product

Non-technical. They have never opened the module and will not. They want the cost of leaving it alone in delivery terms, and they want to know what they are being asked for.

Questions, in order:

1. **What does this cost the business today?** The same felt pain as the tech lead, in plain words: how many separate changes the last provider took and over how many months, how much the file has grown, how many people can work on it. No file names in a heading.
2. **What happens if we do nothing?** The trend, and the concentration of knowledge. A single person holding most of the history is a delivery risk this reader understands without translation.
3. **How much work is it?** The commit count, described as small reviewable steps that can each be undone on their own, and the two-phase schedule. Say that no time estimate exists and why.
4. **Is it risky?** Nothing a customer sees changes. The test counts. The one gap named plainly.
5. **What do you need from me?** The time, and a date to check the result against the numbers on this page.

Leads with the cost in delivery terms. Vocabulary is plain: "the file that handles this" rather than its path, "a check that proves nothing changed" rather than "characterisation test". File names and step ids appear only in the appendix, where the shape diagram lives with its legend, since a group box labelled "legacy routers" is the right level for this room and the paths behind it are one click away for whoever asks. No dependency diagram, no catalogue names, no step table on a slide. Charts are the before-and-after bar pair and the growth columns, and nothing else.

Usually four slides.

## A mixed room

Sprint planning, or a review with the lead, two seniors and a product manager present. Nobody agrees on what matters, so the order is fixed: the cost of doing nothing, then the safety story, then the cost of doing it, then the decisions. The technical evidence is one click away.

Questions, in order:

1. **What does leaving it cost?** The felt pain, stated in plain words in the heading and with the file names in the small print.
2. **What could go wrong, and what catches it?** The spill slide from the tech lead brief.
3. **What does doing it cost?** The two-phase schedule and the commit count, with the no-estimate line.
4. **What is deliberately left alone?** One card, because the seniors in the room will ask.
5. **What does this room decide today?** The first phase, the reviewer, the names.

Leads with the cost of doing nothing. Headings are plain, small print is technical. The shape diagram, the full step table and the hotspot table are all in the appendix, with the diagram's legend under each panel for the seniors, and the divider slide's pills are how they get to them during the meeting.

Usually five slides.

## Order the ids after the table

A step id such as R3 or T4 means nothing until the slide that lists the steps has been seen. Whatever the brief's question order, the slide that carries the step table comes before any slide that cites a step id in its prose, and the first slide to use an id says once what R and T stand for. The cold reader stops on every id it has not met.

## Cognitive load, for every room

A slide is read in the time it takes the presenter to say its heading. Whatever cannot be taken in by then is appendix material. Three tests, applied to every slide before rendering: the heading alone answers the question the slide exists for; there is one exhibit, and every number on the slide is either in the exhibit or is the exhibit's one takeaway; nothing on the slide restates something the exhibit already shows. Count the numbers on a slide. Above about a dozen, the slide is asking the room to read a table, and a table belongs in the appendix.

## The argument outline

Before opening the scaffold, write the outline: one line per slide, each line a claim in the audience's words followed by the plan figure that proves it and the exhibit that shows it, or "no exhibit". Then read it against the brief above. A slide answering a question the brief does not ask is cut or sent to the appendix. A question the brief asks that has no slide is a gap to fill or to name. Show the outline to the developer before writing markup, and render unless they redirect.

Two pitches from one plan are normal. A developer who has to convince the lead and then brief the team renders twice, from the same markdown at the same hash, with a different brief each time, and the two pages carry the same numbers and different arguments.

The second render still starts from a fresh copy of the scaffold, never from the first page. Re-entering at the argue phase means the plan is not re-run. It does not mean the earlier page is a base to edit. A page written weeks earlier carries whatever the scaffold looked like then, so copying its head silently ships a stale theme and stale component CSS, and every mechanical gate stays green while it does.
