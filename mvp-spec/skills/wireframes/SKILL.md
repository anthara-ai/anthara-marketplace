---
name: wireframes
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"11 - Wireframes.md\" and the 11.NN files: a clickable set of grayscale HTML wireframes, one per screen with its states, planned from the journeys in 04 and walked end to end with the founder."
---

# 11 Wireframes

Phase 11 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `11 - Wireframes.md` and the `11.NN` HTML files: the journeys from 04 as screens a founder can click through, each screen in every state that changes what the user sees. Lo-fi on purpose: grayscale boxes and labels showing layout, flow and states, nothing else. High fidelity here is a trap. The founder starts debating button colours instead of scope, and Incubyte's designers inherit anchoring they have to fight. The index says this in its own words so the reader knows the plainness is deliberate.

Two rules keep the wireframes faithful to the interview. Screens come from the journeys, not from the feature list. 06 is a flat list and 04 is the sequence, and a set of screens derived from 06 loses everything that happens between features: the confirmation after an action, the handoff arriving on the other persona's side, the step a story names that no feature owns. And the plan comes before the drawing. Every screen, state and transition is written into the index and confirmed before any HTML exists, so a state cannot be forgotten at screen nine because it is already a row waiting to be drawn.

## What to produce

- The index, `11 - Wireframes.md`, written first. Walk each included journey in 04, persona by persona, step by step. Each step that shows the user something new is a screen, which is the same definition the size line in 05 uses. For each screen record the persona, the journey step, the 06 features it carries, the states it needs, and its transitions: which control leads to which screen. Each state names its source: an unhappy path in 06, a none cell in 07, or a designer default. A control drawn dashed because it is not in the first version has no state and no transition in the index; a state in the index has a live control that reaches it. Then the one-paragraph statement that the wireframes are deliberately low fidelity and why. Operator screens count; an approval queue is a screen.
- One HTML file per screen, `11.NN - Wireframe - <Screen Name>.html`, numbered in journey order and grouped by persona. Self-contained: inline styles and inline script only, no external stylesheets, scripts, fonts or images. Grayscale only. Real copy where the voice from 10 has been approved, placeholder text elsewhere.
- Each frame is drawn at the shape of its device, which 08 decided per persona. A phone screen is a phone-shaped frame, about 390 pixels wide, with its content laid out inside it, what sits above the fold above the fold, and its states as phone frames side by side. A web screen is drawn at desktop width, and where the screen has two panes they are drawn as two columns, not as two stacked boxes labelled left and right. The frame is the wireframe; the page around it is only scaffolding.
- Draw the layout, do not describe it. A chart is a box with a placeholder curve and its axes labelled. An image is a crossed box. A list is rows. A region's position and size on the frame is the information; a sentence saying what would be there is not. If a frame reads like a description of a screen rather than a picture of one, redraw it.
- Draw controls as the controls they are. A checkbox is a checkbox, a radio group is radio buttons, a set of selectable tags is a row of bordered pills with the chosen ones filled, a toggle is a toggle, a dropdown is a select, a text field is a field with its label and placeholder. Native form elements are grey by default and cost nothing in fidelity; a line of text saying "pick from the list" tells a designer nothing about how the picking works. Where a state changes a control, draw the changed control.
- One primary action per frame, drawn heavier than everything else, with navigation drawn as navigation: a bottom bar on a phone, a side or top bar on the web. Every transition is still a real link, but a screen is not a row of equal buttons, one per transition; that is an inventory, and nobody would ship it. Secondary and rare actions are drawn smaller or placed where they would live.
- Readable at a glance in a browser at any width; the phone frames must not clip or overflow when the browser is narrow.
- Every file is a working node in the flow. A strip at the top names the persona, the journey step and where it sits, step k of n, with links to the previous and next screen. Every control that moves the user somewhere is a real link to that screen's file. A control that can fail links to its failure state. Every screen has a way back that a user would actually find, not only the strip. A screen reached from more than one place returns the user to where they came from; draw the back control per entry point or say in the index which entry the drawn one assumes. Every persona's journey begins at an arrival screen, sign-in or invite or first open, never in the middle. The screen's states sit in the same file as labelled frames with a small in-page switcher so the founder can flip between them; the default state shows first.
- A hub, `11.00 - Wireframe - Start.html`: one entry per persona journey, linking to its first screen, so the founder starts at the beginning and clicks through the whole story.

Check the screen count against the size line in 05; a mismatch is a finding that goes back to 05.

## How to work with the founder

- Build the index first and confirm it before drawing anything. Offer the screen list per journey as a multi-select of what 04 implies, and the states per screen the same way. Missing screens and missing states are cheaper to find in a table than in twelve HTML files.
- Decide the designer defaults yourself. That a list starts empty, that a submit waits, that a failure needs a message, that a destructive action asks first: no designer asks a client whether these exist, so plan them, draw them and mark them as defaults. Ask the founder only where what a state says or offers is a decision they would have an opinion on: what the empty state offers a first-time user, what happens on the failure specific to this domain, what the user sees right after the action the product exists for, who can undo something sensitive. The test is whether a founder would care; if no founder would, the call is yours.
- Draw a whole journey, verify it (below), then walk it. Open the hub in the founder's browser for them and ask them to click through one persona's journey end to end, then ask what did not match the story they told in 04, as a menu of the likely mismatches with free text for the rest. A screen judged on its own looks fine; a journey clicked through shows the missing step.
- When a screen, a state or a dead end reveals a missing feature or step, that is a finding, not a wireframe problem: update 04, 05 and 06 as needed, tell the founder, update the index, and carry on.
- Redirect colour, font and imagery comments to 10. Layout, flow and states only here. Layout is in scope: where the primary action sits, what is above the fold, which control does the choosing. Those are exactly the comments to invite.

## Verify before the founder walks it

The founder's walk is for judgement about their product, not for finding broken links. Before handing a journey over, verify it yourself and fix what fails. Never stall on verification; if a method is unavailable, use the next one and move on.

First, use a browser if one is available: the Claude in Chrome connector, or Cowork's built-in browser. Open the hub and click the journey through end to end as the founder will, flipping every state on every screen. Confirm that each screen renders as drawn and at the shape of its device, that controls look like the controls they are, that every control that should move you does, that the failure links land on the failure states, that the states the index lists are the ones you can reach, that you can get back from every screen, and that the strip's previous and next take you where they say. If the browser cannot open local files, serve the spec folder locally with a one-line static server and open it through localhost instead of giving up. Anything that renders wrong or does not act as the index says is fixed before the founder sees it.

If no browser is available, or opening the files in one fails, fall back to checking the code and move on:

- Every link in the hub and in every 11.NN file points at a file that exists in the folder, and nothing points outside it.
- Starting from the hub, following each journey's next links visits every screen the index lists for that persona, in order, and ends at its last screen with no dead end and no loop; every screen's previous link points back to the one before it.
- Every file parses as HTML with its tags balanced, carries the strip naming persona and step, and contains exactly the states the index lists for it; the in-page switcher references frames that exist in that file, and the default state is the one shown first.
- No file references an external stylesheet, script, font or image, and nothing in any file is coloured.
- The index and the files match one to one: every row has its file, every file has its row, and the state sources in the index are the ones drawn. No dashed control has a state or a transition; no state lacks a live control.
- Every screen has a way back inside the frame, every persona's journey starts at an arrival screen, and a phone frame is phone-shaped with nothing clipped at a narrow browser width.

Run these as commands, not by eye. A fix that changes the plan is written back to the index first. Tell the founder in one line which method verified the journey, so they know whether it was clicked through or checked in code.

## Done when

Every step of every included journey in 04 has a screen, every transition in 04 is a working link and the journey has been verified in a browser or, failing that, in code, every unhappy path in 06 and every none cell in 07 is a reachable state on its screen, a founder can click from the hub through each persona's journey from its arrival screen without hitting a dead end and can get back from every screen, every frame is drawn at the shape of its device with its controls drawn as controls, the screen count matches the size line in 05, the index traces every screen and state to its source, and the founder has walked every journey.

## Feeds

- 13: screens the founder is unsure about; a state's content they have not decided.
- 04, 05 and 06: anything a screen, a state or a dead end exposed as missing.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
