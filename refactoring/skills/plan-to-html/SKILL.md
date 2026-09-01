---
name: plan-to-html
description: "This skill should be used when a developer asks to \"present the refactoring plan\", \"pitch the refactoring\", \"make the plan a web page\", \"turn the refactoring plan into HTML\", \"build slides for the refactoring\", \"get the team to agree to this refactoring\", \"show the team why we should refactor this\", or invokes /refactoring:plan-to-html with a module or folder name, an optional target location and an optional problem statement. With no module given it plans the current working directory. It runs the `plan` skill, asks who the pitch is for, and writes one self-contained HTML page that argues the case to that audience."
argument-hint: "[module or folder] [into <target folder or file>] [because <problem statement>] [for <audience>]"
---

# Refactoring plan as a pitch

Write `docs/refactoring/<module-slug>-plan.html`: a page that argues for the refactoring, aimed at the people whose agreement the developer needs.

The markdown plan is the document a developer works from. This page is the document a team says yes from. They carry the same numbers and they are not the same document. The markdown is organised for someone doing the work in order. The page is organised to win an argument in a room where nobody has to agree.

The page changes no code and adds no analysis. Every number on it comes from the markdown plan.

## What this page is for

Someone read a 4,000-line class, spent an afternoon on the forensics, and now has to convince a lead who is protective of the roadmap and two seniors who have watched a refactoring go wrong before. Nobody in that room is obliged to read anything. The page has to earn the next five minutes in the first thirty seconds.

That has consequences for how it is built:

**Lead with the argument, not the method.** A reader who scrolls no further should already know why this module, why now, and what it costs. How the numbers were gathered matters to the one person who asks, and that person can scroll.

**One number does the work.** Pick the single figure that makes the case for this particular module and give it the top of the page. It is usually about pain the room has already felt, such as how much the file grew this year, how many commits landed in it, or how many files a routine change touches. Dependency counts and line counts are true and rarely move anyone.

**Answer the three objections before they are raised.** Why now rather than later, what breaks, and what it costs. A plan that cannot answer all three is not ready to be pitched, and the page should say which one it cannot answer rather than route around it.

**Evidence sits behind the claim it supports.** Tables, methodology and the full step detail belong further down or behind a disclosure, reachable by the person who asks for them and out of the way of the person who does not.

The failure to avoid is a faithful rendering of the markdown with charts added. Section-for-section transcription produces a report, and a report is read by people who already agreed.

## Order of work

1. **The voice and the theme.** Invoke `refactoring:incubyte-writing-voice` and write every sentence on the page in that voice, since the page is read outside the team that wrote it. It governs how sentences are built. Where it and anything here disagree on that, it wins. Invoke it once per session.

   Then ask the developer for the company's website, in one line, unless a URL is already sitting in `$ARGUMENTS` or was given earlier this session. Skip the question on a re-render of an already-rendered plan and reuse the theme it used. If the developer has none or says no, move on with a restrained default of one accent against a near-white page, no need to ask twice. When a URL is given, fetch it and pull four things: the page background, the body text colour, one accent colour the site itself uses for emphasis (a link, a button, a highlight, never a warning or error colour), and the body font stack. Those four are the page's palette. Derive the greys, panel and rule tones from the text colour so they stay neutral, and keep the print stylesheet plain. The page keeps its own restrained design, a document with the company's colours rather than a copy of the site.

2. **Get the plan.** Invoke the `refactoring:plan` skill with `$ARGUMENTS` unchanged and let it finish. One exception: when `docs/refactoring/<module-slug>-plan.md` already exists and the commit hash in its summary block equals the current `git rev-parse --short HEAD`, ask in one line whether to render that plan or re-run the analysis, and render it when the developer says nothing specific. A plan written at a different hash is stale, so re-run the analysis rather than rendering it silently.

3. **Ask who the pitch is for.** Ask once, with `AskUserQuestion`, unless the arguments already name an audience such as "for the CTO" or "for my team". Offer the room the developer is most likely walking into:

   - **My team**, the developers who will do the work. They want the shape of the change and where the danger is. Assume the codebase is familiar and skip the orientation.
   - **Tech lead or EM**, who approves the time. They want the cost, the calendar, what it competes with, and evidence that it will not spill.
   - **Leadership or PM**, non-technical. They want the business cost of leaving it alone, in delivery terms rather than in lines of code. Write it so a reader who has never opened the module follows every sentence.
   - **A mixed room**, such as sprint planning. Lead with the cost of doing nothing, then the safety story, and keep the technical evidence one click away.

   Then write the page for that audience specifically. It changes what leads, which chart is worth drawing, how much is explained and how much is assumed, and how technical the language gets. It never changes the numbers.

4. **Read the plan and pull its numbers.** Every number on the page comes from the markdown. Compute nothing new and invent nothing. When the argument needs a figure the plan does not carry, say so in place rather than estimating, and keep it brief.

5. **Decide the argument, then build the page around it.** Before writing any markup, settle three things: the one number that leads, the order the case is made in, and what is evidence rather than argument. Then design the page to carry it. There is no template and no required section list. A short page that lands is better than a complete one that does not.

6. **Write the page** to `docs/refactoring/<module-slug>-plan.html`, in the theme from step 1. Inline CSS, inline SVG and inline script only, no external resource of any kind, so the file opens from disk, attaches to a pull request and pastes into a wiki. A themed font loaded from a font service is still an external resource, so name the font in a stack that falls back to the system's own and keep only the colours. Include a print stylesheet, since someone will project it or print it.

7. **Verify.** Open the page in a browser if one is available, Claude in Chrome or the equivalent. Check that every chart draws, that no text overlaps a mark, that any collapsible opens, that text stays readable against the themed background, and that nothing runs off the page at laptop width. If no browser is available, check the code instead: tags balance, every internal anchor resolves to an id on the page, every SVG has a `<title>`, and nothing loads from outside the file. Never stall on verification. Tell the developer in one line which method ran.

8. **Then.** Tell the developer both paths, the markdown and the HTML, who the page was written for, and that nothing in the code has changed. Suggest opening the HTML in the meeting and the markdown when doing the work.

## Judgement, not a template

How the page looks and what it contains is a judgement call for each plan and each audience. A module with one dominant hotspot argues differently from a module with debt spread across a dozen files. A plan with 411 existing tests argues differently from one where every step runs blind. Read what this plan actually says and make the case that fits it.

What holds regardless:

**Charts are for the two or three claims that carry the argument.** Draw the ones that persuade this audience, at a size a room can read from a laptop screen. A chart nobody stops on is worse than a sentence, since it costs space and attention and returns neither.

**Every mark is to scale.** A bar chart with a fixed-width "before" bar across every row is a picture of a ratio drawn to look like a magnitude, and a reader who notices stops trusting the rest of the page. When a scatter's dots are placed for label legibility rather than by value, say so in the caption or drop the axis lines that imply otherwise.

**Every chart's numbers appear in text beside it.** Someone will ask for the figure. A chart is a summary of a table and never a substitute for one.

**Restraint reads as credible.** One accent colour for what the plan targets and for the "after" number, grey for what is left alone and for the "before" number, whether that accent is the default or pulled from the company's site in step 1. A second and third colour makes a reader hunt for a meaning that is not there. Check the themed accent before setting it, since an accent that fails contrast against its own background, or that the site uses for warnings and errors, ships a page that is hard to read or that quietly flags the plan as a problem. Fall back to the default accent rather than either.

**The page loads nothing.** A font, a chart library, an icon. Any of them breaks the moment the page is attached to a pull request or opened offline.

**The page works with JavaScript off.** Script does disclosures and nothing else.

**Every chart carries an SVG `<title>`.** The page is pasted into wikis and read on other people's machines.

**Gaps are placed where they are useful, not collected at the end.** A gap that blocks the work, such as a test baseline that was never run green, belongs next to the step it blocks, as a prerequisite. A gap that is merely uncomputed belongs in small text near the chart that would have shown it. A closing section listing everything that could not be measured reads as a confession and hands the room its objection.

## Honest persuasion

Persuasion here is selection and order. The page argues by leading with the strongest true thing, never by softening a weak one.

- **No number appears that is not in the plan.** Every figure is traceable to the markdown. Where a gap matters, the page says so.
- **No chart overstates its data.** See the scale rule above.
- **A risk the plan rated medium stays medium on the page.** Naming the riskiest step and what catches it is more convincing than a page where everything is low risk.
- **What the plan will not fix stays visible.** A plan that removes 1,200 lines from a 4,500-line file has not fixed the file, and a reader who works out that omission alone stops believing the rest.
- **The page and the markdown never disagree.** They are written from the same run at the same hash. Re-run both rather than editing one.

## Done when

The file exists beside the markdown plan and opens from disk with no network. It is written for a named audience, and it reads as a pitch to that audience rather than as the markdown with tags. Every chart draws, is to scale, carries a `<title>`, and has its numbers in text beside it. Someone in the intended audience could read the first screen and say why this module, why now, and what it costs. Every step in the plan is reachable on the page, whether or not it is on the first screen. The page prints readably.
