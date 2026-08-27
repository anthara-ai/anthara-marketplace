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

- The index, `11 - Wireframes.md`, written first. Walk each included journey in 04, persona by persona, step by step. Each step that shows the user something new is a screen, which is the same definition the size line in 05 uses. For each screen record the persona, the journey step, the 06 features it carries, the states it needs, and its transitions: which control leads to which screen. Each state names its source: an unhappy path in 06, a none cell in 07, or a designer default. Then the one-paragraph statement that the wireframes are deliberately low fidelity and why. Operator screens count; an approval queue is a screen.
- One HTML file per screen, `11.NN - Wireframe - <Screen Name>.html`, numbered in journey order and grouped by persona. Self-contained: inline styles and inline script only, no external stylesheets, scripts, fonts or images. Grayscale only. Boxes with labels for every region and control, real copy where the voice from 10 has been approved, placeholder text elsewhere. Readable at a glance in a browser at any width.
- Every file is a working node in the flow. A strip at the top names the persona, the journey step and where it sits, step k of n, with links to the previous and next screen. Every control that moves the user somewhere is a real link to that screen's file. A control that can fail links to its failure state. The screen's states sit in the same file as labelled frames with a small in-page switcher so the founder can flip between them; the default state shows first.
- A hub, `11.00 - Wireframe - Start.html`: one entry per persona journey, linking to its first screen, so the founder starts at the beginning and clicks through the whole story.

Check the screen count against the size line in 05; a mismatch is a finding that goes back to 05.

## How to work with the founder

- Build the index first and confirm it before drawing anything. Offer the screen list per journey as a multi-select of what 04 implies, and the states per screen the same way. Missing screens and missing states are cheaper to find in a table than in twelve HTML files.
- Decide the designer defaults yourself. That a list starts empty, that a submit waits, that a failure needs a message, that a destructive action asks first: no designer asks a client whether these exist, so plan them, draw them and mark them as defaults. Ask the founder only where what a state says or offers is a decision they would have an opinion on: what the empty state offers a first-time user, what happens on the failure specific to this domain, what the user sees right after the action the product exists for, who can undo something sensitive. The test is whether a founder would care; if no founder would, the call is yours.
- Draw a whole journey, then walk it. Ask the founder to open the hub and click through one persona's journey end to end, then ask what did not match the story they told in 04, as a menu of the likely mismatches with free text for the rest. A screen judged on its own looks fine; a journey clicked through shows the missing step.
- When a screen, a state or a dead end reveals a missing feature or step, that is a finding, not a wireframe problem: update 04, 05 and 06 as needed, tell the founder, update the index, and carry on.
- Redirect colour, font and imagery comments to 10. Layout, flow and states only here.

## Done when

Every step of every included journey in 04 has a screen, every transition in 04 is a working link, every unhappy path in 06 and every none cell in 07 is a reachable state on its screen, a founder can click from the hub through each persona's journey without hitting a dead end, the screen count matches the size line in 05, the index traces every screen and state to its source, and the founder has walked every journey.

## Feeds

- 13: screens the founder is unsure about; a state's content they have not decided.
- 04, 05 and 06: anything a screen, a state or a dead end exposed as missing.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
