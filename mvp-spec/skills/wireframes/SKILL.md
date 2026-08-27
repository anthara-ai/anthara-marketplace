---
name: wireframes
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"11 - Wireframes.md\" and the 11.NN files: a clickable, mid-fidelity, grayscale set of HTML wireframes, one per screen with its states, planned from the journeys in 04 and walked end to end by the founder as each persona."
---

# 11 Wireframes

Phase 11 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Turn the journeys in 04 into screens the founder can click through as each persona, from arrival to their third week, with everything that can go wrong along the way. Write `11 - Wireframes.md` and one `11.NN` HTML file per screen.

Two people read these, and one test serves both. An Incubyte designer should be able to build the layout from a frame without asking a question. The founder should be able to look at a frame and say "yes, that is my app" or "no, that is wrong". A frame that fails either has not been drawn yet, whatever it looks like.

These are mid-fidelity. The wireframe decides device shape, layout and spacing, text hierarchy by size and weight, every control as the control it is, the primary action, navigation, real content wherever the spec knows it, every state and every transition, and it is clickable end to end. It deliberately does not decide colour, typeface, imagery, motion or brand; those live in 10, and a wireframe that looked finished would start an argument about colour and anchor the designers who come next. Grey only. The index says all of this in one short paragraph, so a founder knows what is settled and what is not.

## Plan first

The index is the plan, written and confirmed before any HTML. Walk each included journey in 04, persona by persona, step by step. Every moment the user sees something new is a screen. Every way that screen can look different is a state: before there is data, while something waits, when it fails, when it succeeds, when this persona lacks permission. Each state comes from an unhappy path in 06, a none cell in 07, or your own judgement as the designer, and the index says which. Everything the user can do that moves them is a transition to a named screen. Operator screens count. A control drawn dashed because it is out of the first version has no state and no transition.

Drawing then fills the plan. A state cannot be lost at screen nine because it is a row waiting to be drawn. Check the screen count against the size line in 05 before drawing; a mismatch is a finding for 05.

## Drawing

Draw at the shape of the device 08 chose for this persona. A phone screen is a phone frame, about 390 pixels wide, with its content laid out inside it and its states beside it as more phone frames. A web screen is desktop width, and two panes are two columns. The frame is the wireframe; the page around it is scaffolding.

Show, do not tell. A chart is a box with a curve and labelled axes. An image is a crossed box. A list is rows with realistic spacing. A checkbox is a checkbox, a radio group is radios, a set of selectable tags is bordered pills with the chosen ones filled, a toggle is a toggle, a field has its label and placeholder. Native controls are grey already. A sentence describing what would be here tells the designer nothing about how it works and the founder nothing about how it feels.

Show hierarchy with size, weight and space, not with a typeface: two or three text sizes are enough to tell a title from body from a caption. Give each frame one primary action, drawn heavier, and draw navigation as navigation, a bottom bar on a phone, a side or top bar on the web. Every transition is a live link, but a screen is not a row of equal buttons.

Use real content wherever the spec knows it: the personas' names, the product's own nouns, the approved lines from 10. A placeholder is for content nobody has decided yet, and it should look like a placeholder rather than pass for a decision. Draw the same control the same way on every screen, so thirty files read as one product. Where a frame cannot show a behaviour, a drag, a timer, what a disabled control is waiting for, add a one-line note under the frame saying what happens.

## The set

`11.00 - Wireframe - Start.html` is the hub: one entry per persona, each starting at that persona's arrival screen, sign-in or invite or first open, never mid-journey. Every file carries a strip naming the persona, the step, screen k of n, and links to Start, previous and next. Its states sit in the same file behind a small in-page switcher, default first. Every control that moves the user is a link to that file; a control that can fail links to its failure state; every screen has a way back a user would find, and a screen with several entry points returns to the one the user came from, or the index says which entry the drawn back assumes. Inline styles and script only; nothing external; nothing coloured.

## With the founder

Confirm the plan as menus: the screens per journey and the states per screen, offered from what 04, 06 and 07 imply. Decide the designer defaults yourself; ask only where a state's content is a decision the founder would care about: what the empty state offers a first-time user, what happens on the failure specific to this domain, what the user sees right after the action the product exists for, who can undo something sensitive.

For the two or three screens that carry the product's core interaction, sketch two layouts before drawing the rest and let the founder pick, as a menu. Everything else follows the one they chose.

Draw a whole journey, verify it, then open the hub in the founder's browser and ask them to walk it as that persona, end to end. Then ask what did not match the story in 04, as a menu of likely mismatches plus free text. Layout comments are in scope and welcome: where the primary action sits, what is above the fold, which control does the choosing. Colour, typeface and imagery go to 10. Anything a screen exposes as missing is a finding for 04, 05 or 06, written back to the index first.

## Verify

Walk each journey yourself before the founder does. Use a browser if one is available, Claude in Chrome or Cowork's built-in browser, serving the folder over localhost if it cannot open local files: click through as the persona, flip every state, and confirm each frame is device-shaped with its controls drawn as controls, that every link and every back goes where it should, and that nothing clips at phone width. If no browser is available, check the code and move on: links resolve inside the folder, each journey walks from the hub to its last screen with working previous links and no dead end, tags balance, each file has its strip and exactly the states and transitions the index lists, nothing is external or coloured, no dashed control has a state. Never stall on verification. Tell the founder in a line which method ran.

## Done when

The founder can be each persona from the hub, through their arrival screen, to their third week, including what goes wrong, without being told what to imagine. An Incubyte designer could build every frame without a question. Every 06 unhappy path and 07 none cell is a reachable state, the count matches 05, the index traces every screen, state and transition to its source, and the founder has walked every journey.

## Feeds

- 13: a state's content the founder has not decided; screens they are unsure about.
- 04, 05 and 06: what a screen or a dead end exposed as missing.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
