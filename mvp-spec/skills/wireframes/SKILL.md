---
name: wireframes
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"11 - Wireframes.md\": one self-contained grayscale HTML wireframe per screen, plus the screen index."
---

# 11 Wireframes

Phase 11 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `11 - Wireframes.md` and one `11.NN - Wireframe - <Screen Name>.html` file per screen, each showing the screen in every state that changes what the user sees. Lo-fi on purpose: grayscale boxes and labels showing layout, flow and states, nothing else. High fidelity here is a trap. The founder starts debating button colours instead of scope, and Incubyte's designers inherit anchoring they have to fight. The index says this in its own words so the reader knows the plainness is deliberate.

## What to produce

- One HTML file per screen, numbered in journey order, self-contained: no external stylesheets, scripts, fonts or images. Grayscale only. Boxes with labels for every region and control, real copy where the voice from 10 has been approved, placeholder text elsewhere. Plain links between screens where the flow matters. Readable at a glance in a browser at any width.
- The screen's states, in the same file, as labelled frames beside the default. A screen has more than one state and the ones that change what the user sees get drawn: before there is any data, while something is pending, when something fails, after something succeeds, when this persona lacks permission. Decide which apply to this screen as a designer would, rather than drawing all of them everywhere. An unhappy path decided in 06 and a none cell in 07 each produce a state that must appear on its screen.
- The index in `11 - Wireframes.md`: a table of screen, journey step in 04, Must feature in 06, the states drawn, and file, marking which states came from a founder decision and which are designer defaults. Plus the one-paragraph statement that these are deliberately low fidelity and why.

Derive the screen list from 05 and 06: every user-facing Must needs a screen, and every screen must trace back to a journey step and a feature. Operator screens count; an approval queue is a screen.

## How to work with the founder

- Write the screen list first and confirm it before drawing anything. Missing screens are cheaper to find in a list.
- Decide the states yourself. That a list starts empty, that a submit waits, that a failure needs a message, that a destructive action asks first: no designer asks a client whether these exist, so draw them and mark them as defaults in the index. Ask the founder only where what a state says or offers is a decision they would have an opinion on: what the empty state offers a first-time user, what happens on the failure specific to this domain, what the user sees right after the action the product exists for, who can undo something sensitive. The test is whether a founder would care; if no founder would, the call is yours.
- Draw a screen with its states, ask the founder to open it, and walk through it against the journey step it serves. One screen at a time.
- When a screen or a state reveals a missing feature or step, that is a finding, not a wireframe problem: update 05 and 06, tell the founder, and carry on.
- Redirect colour, font and imagery comments to 10. Layout, flow and states only here.

## Done when

Every user-facing Must has a screen, every screen traces to a journey step and a feature, every state a founder decision produced appears on its screen, the index says the plainness is deliberate and which states are defaults, and the founder has walked every screen.

## Feeds

- 13: screens the founder is unsure about; a state's content they have not decided.
- 05 and 06: anything a screen or a state exposed as missing.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
