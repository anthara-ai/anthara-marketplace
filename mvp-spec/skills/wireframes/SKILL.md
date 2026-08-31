---
name: wireframes
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"11 - Wireframes.md\" and the 11.NN files: a clickable, mid-fidelity, grayscale set of HTML wireframes, one per screen with its states, planned from the journeys in 04 and walked end to end by the founder as each persona."
---

# 11 Wireframes

Phase 11 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Turn the journeys in 04 into screens the founder can click through as each persona, from arrival to their third week, with everything that can go wrong along the way. Write `11 - Wireframes.md` and one `11.NN` HTML file per screen. Plan the set, settle its structure with the founder, then draw.

Two people read these, and one test serves both. An Incubyte designer should be able to build the layout from a frame without asking a question. The founder should be able to look at a frame and say "yes, that is my app" or "no, that is wrong". A frame that fails either has not been drawn yet, whatever it looks like.

These are mid-fidelity. The wireframe decides device shape, layout and spacing, text hierarchy by size and weight, every control as the control it is, the primary action, navigation, real content wherever the spec knows it, every state and every transition, and it is clickable end to end. It deliberately does not decide colour, typeface, imagery, motion or brand; those live in 10, and a wireframe that looked finished would start an argument about colour and anchor the designers who come next. Grey only. The index says all of this in one short paragraph, so a founder knows what is settled and what is not.

## Plan first

The index is the plan, written and confirmed before any HTML. Walk each included journey in 04, persona by persona, step by step. Every moment the user sees something new is a screen. Every way that screen can look different is a state: before there is data, while something waits, when it fails, when it succeeds, when this persona lacks permission. Each state comes from an unhappy path in 06, a none cell in 07, or your own judgement as the designer, and the index says which. Every control on the screen is listed with its outcome: it goes to a named screen, it changes this screen to a named state, or it is out of the first version. A control with no outcome is a gap in the plan, a missing screen or state or a control that should not be there, and it is resolved before drawing. Operator screens count.

Drawing then fills the plan. A state cannot be lost at screen nine because it is a row waiting to be drawn. Check the screen count against the size line in 05 before drawing; a mismatch is a finding for 05.

## Shape the product before drawing it

Between confirming the index and drawing the first frame, settle the structural decisions that every screen will then inherit. A wireframe set drawn without them is a set of defaults nobody chose, and defaults are expensive here: the founder sees thirty frames already agreeing with each other and reads that agreement as settled, so the moment to raise an alternative is before it is drawn thirty times, not after.

Find the decisions in this product rather than working through a list. Read the confirmed index and ask what a designer must settle once for the whole set, and what a competent designer could reasonably do more than one way. Anything that fits both is a decision the founder should make. Where a screen carries a genuinely open layout question of its own, that is a decision too, even though it settles one screen rather than the set.

Navigation is the familiar example, a side rail against a top bar against a bottom bar, but it is one instance of the question, not the question. The rest depend on the product in front of you. How a persona moves between the product's main areas, and whether they can move directly or must go back first. Whether the core object opens as a full screen, a panel beside the list, or an overlay. Whether a long form is one page or a sequence of steps. How dense a screen is, which decides how much a user sees at once and how much they scroll. Where a workflow's primary action lives so it is findable at every step. Whether a persona with two roles switches context or sees both at once. A product with one persona and four screens has few of these; an operator console has many.

Offer each one as a menu of two or three alternatives, drawn for this product rather than named in the abstract, and say plainly what each would mean for the founder's own users: which of their journeys gets shorter, what a persona sees first, what becomes harder to find. A founder cannot choose between "side navigation" and "top navigation", and they can choose between one that keeps every section visible to a therapist who moves between them all day and one that gives the child's screen more room by hiding them. Where the journeys in 04, the personas in 03 or the platform in 08 already decide it, it is not a decision, so do not offer it. Say which alternative you would pick and why, because a founder who has no view will take the recommendation and one who does will now argue with something concrete.

Record what they chose in the index, in a short section of its own, each decision with its alternatives and the reason for the pick. That section is what keeps thirty files consistent, and it tells the designer which structures were chosen rather than defaulted into. A decision the founder cannot make yet goes to 13 and the index says which alternative was drawn meanwhile.

## Drawing

Draw at the shape of the device 08 chose for this persona. A phone screen is a phone frame, about 390 pixels wide, with its content laid out inside it and its states beside it as more phone frames. A web screen is desktop width, and two panes are two columns. The frame is the wireframe; the page around it is scaffolding.

Show, do not tell. A chart is a box with a curve and labelled axes. An image is a crossed box. A list is rows with realistic spacing. A checkbox is a checkbox, a radio group is radios, a set of selectable tags is bordered pills with the chosen ones filled, a toggle is a toggle, a field has its label and placeholder. Native controls are grey already. A sentence describing what would be here tells the designer nothing about how it works and the founder nothing about how it feels.

The same rule governs the words. Separate the intent from the content, then apply the intent when you write the content. Everything the founder said in the interview about how the product should feel is intent, and none of it goes on a screen. Each one tells you what to put there instead. A few examples:

- **Honesty.** Show the price, the fee and the total. Do not write "Read this before you pay anything".
- **No surprises.** Show the rule that applies and the date it takes effect. Do not write "Nothing here should be a surprise".
- **The team's work is respected.** Show who added the item and when. Do not write "Generated from the team's own work".

Every other intent this founder raised works the same way. Take the quality they named, ask what a user would have to see on this screen to conclude it for themselves, and draw that. A frame that states the intent has skipped the work of applying it, and a line that would sit unchanged on another screen is intent that reached the page.

Show hierarchy with size, weight and space, not with a typeface: two or three text sizes are enough to tell a title from body from a caption. Give each frame one primary action, drawn heavier, and draw navigation as navigation, a bottom bar on a phone, a side or top bar on the web. Every transition is a live link, but a screen is not a row of equal buttons.

Use real content wherever the spec knows it: the personas' names, the product's own nouns, the approved lines from 10. A placeholder is for content nobody has decided yet, and it should look like a placeholder rather than pass for a decision. Draw the same control the same way on every screen, so thirty files read as one product. Where a frame cannot show a behaviour, a drag, a timer, what a disabled control is waiting for, add a one-line note under the frame saying what happens.

## The set

`11.00 - Wireframe - Start.html` is the hub: one entry per persona, each starting at that persona's arrival screen, sign-in or invite or first open, never mid-journey. Every file carries a strip naming the persona, the step, screen k of n, and links to Start, previous and next. Its states sit in the same file behind a small in-page switcher, default first. No click is silent. Anything that looks like a control is one: an anchor with an href, a button with a handler, or a native input, never a styled div or span. A founder cannot tell a scope decision from a broken file. A control that goes to another screen links to its file. A control that changes this screen calls the same switcher the state buttons use, so the change happens in place. A control that is out of the first version is drawn dashed and, when clicked, shows a one-line note saying so. A control that can fail links to its failure state. Every screen has a way back a user would find, and a screen with several entry points returns to the one the user came from, or the index says which entry the drawn back assumes. The strip's previous and next are for the reviewer; each journey must be walkable using only the controls inside the frames. Inline styles and script only; nothing external; nothing coloured.

## With the founder

Confirm the plan as menus: the screens per journey and the states per screen, offered from what 04, 06 and 07 imply. Decide the designer defaults yourself; ask only where a state's content is a decision the founder would care about: what the empty state offers a first-time user, what happens on the failure specific to this domain, what the user sees right after the action the product exists for, who can undo something sensitive.

The structural decisions are settled before drawing, under Shape the product before drawing it. For the two or three screens that carry the product's core interaction, sketch the alternatives as frames rather than describing them, and let the founder pick from what they can see. Everything else follows the shape they chose.

Draw a whole journey, verify it, then open the hub in the founder's browser and ask them to walk it as that persona, end to end. Then ask what did not match the story in 04, as a menu of likely mismatches plus free text. Layout comments are in scope and welcome: where the primary action sits, what is above the fold, which control does the choosing. Colour, typeface and imagery go to 10. Anything a screen exposes as missing is a finding for 04, 05 or 06, written back to the index first.

## Verify

Walk each journey yourself before the founder does. Use a browser if one is available, Claude in Chrome or Cowork's built-in browser, serving the folder over localhost if it cannot open local files: click through as the persona using only the controls inside the frames, click every other control on every frame as well, flip every state, and confirm each frame is device-shaped with its controls drawn as controls, that every control does what the index says it does, that every back goes where it should, and that nothing clips at phone width. A control that does nothing is a failure even when the journey walks by the strip. If no browser is available, check the code and move on: links resolve inside the folder, each journey walks from the hub to its last screen with working previous links and no dead end, tags balance, each file has its strip and exactly the states and controls the index lists, no element styled as a control is a div or a span without an href or a handler and every button has one, each journey walks from the hub using only in-frame controls, nothing is external or coloured, no dashed control has a state. Read the words on each frame and ask whether a sentence could move to another screen unchanged; if it could, it is intent and the frame is missing the content it should show. Never stall on verification. Tell the founder in a line which method ran.

## Done when

The founder can be each persona from the hub, through their arrival screen, to their third week, including what goes wrong, without being told what to imagine. An Incubyte designer could build every frame without a question. Every control does what the index says it does, and each journey walks using only the controls inside the frames. Every 06 unhappy path and 07 none cell is a reachable state, the count matches 05, the index traces every screen, state and transition to its source, and the founder has walked every journey. The structural decisions behind the set are the founder's, recorded in the index with the alternatives they were offered, rather than defaults the drawing happened to take.

## Feeds

- 13: a state's content the founder has not decided; screens they are unsure about; a structural decision they could not make, with the alternative drawn meanwhile.
- 04, 05 and 06: what a screen or a dead end exposed as missing.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
