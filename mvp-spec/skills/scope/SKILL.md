---
name: scope
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"05 - Scope.md\": the inventory of every capability, what is must-have and what is good-to-have, what is in the first version, its size, the non-goals and the replay."
---

# 05 Scope

Phase 05 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `05 - Scope.md`: the whole product as an inventory, labelled, then decided into a first version the right size for what this product needs.

Right-size rather than cut. Screens and flows are cheap to build now, so size is not what hurts a product. What hurts it is behaviour nobody has decided, a first session so full the user never reaches the point, operations the founder cannot run on day one, and bets placed before anyone has used the thing. Inside those limits, give the founder as much as they want. This document records. Do not push scope here, in the file or in the room; put any worry into 13 as a one-line note tagged "for kickoff", where Incubyte's engineers will raise it.

Derive the inventory, do not brainstorm it. Walk every step of every journey in 04, writing each capability it implies as a numbered item that names the persona and step it serves; add anything the domain research says this kind of product is expected to have, as a proposal the founder can take or leave. The founder sees the whole product in one list before anything is classified.

Then classify it yourself, sparing the founder the parts you can decide. The test: a first user cannot reach the day-one value in 02 without a must-have, while a good-to-have makes things better for a user who already has it. Apply it to every item with your own judgement, then bring the founder only the subset you genuinely believe could be good-to-have, as one multi-select: these are the ones I would call good-to-have, tell me where you disagree. Items you are confident about are not asked about; the founder corrects them in the file. The label is fact, not preference, so it is not relabelled because the founder wants something; if they disagree that a user reaches value without it, the label follows the answer.

Inclusion is separate and free. Must-haves are in; good-to-haves are out by default and the founder pulls in as many as they like, as one multi-select over that list. State the running size as information, never a limit. An item whose behaviour is not yet decided is good-to-have and out, with a row in 13; an undecided thing cannot be built.

Never write a price or a date into the document or say one aloud; the words are "a first version" and "a first phase". Never ask what the founder can spend; a volunteered figure goes to 13.

## What the file contains

- The numbered inventory: every capability, naming its persona and journey step, labelled must-have or good-to-have, marked in or out with a one-line reason.
- One size line: "First version: about N screens, M interactions, K flagged as expensive." A screen is a journey step showing the user something new. An interaction changes what the system remembers or what another persona sees; navigating and reading do not count. Flag an item expensive when it involves a third party, regulated data, more than one party at once, real-time behaviour, or logic nobody has built before.
- The included items in build order, sorted by day-one value. An order, not another cut.
- An explicit non-goals list: things a reasonable engineer might assume are included and are not. About what the product is not, whatever its size.
- The replay: a persona's first week told again using only included items, written into the document. This is where missing steps show up before a developer finds them.

## Where founders go wrong

- They want everything. That is normal, not a failure; the honest label plus their free choice of what to include handles it.
- They call something a must-have whose behaviour they have not decided. Ask what it does in enough detail to build; if the answer is not there yet, it is good-to-have and out for now, with a row in 13.
- They cut the operator's work. Approving, moderating and answering support still happen on day one; if they are out, say who does them by hand and record it here.
- They agree to the sort, then put steps back during the replay. That is the replay doing its job; update the file and run it again.
- Scope arrives implied, through "obviously we also need". Write those into the inventory or into non-goals; nothing stays implied.

## Done when

Every inventory item carries a label and an inclusion decision with a reason, the size line is written, the included items are ordered and the non-goals are down. The founder has retold a persona's first week using only included items and found nothing missing.

## Feeds

- 06: every included item gets acceptance criteria there.
- 11: every user-facing included item needs a screen, and the screen count is checked against the size line.
- 13: undecided items, and the one-line notes tagged "for kickoff".

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
