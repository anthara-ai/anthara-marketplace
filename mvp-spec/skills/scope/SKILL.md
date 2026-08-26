---
name: scope
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"05 - Scope.md\": the Must, Later and Never sort, the non-goals list and the Must-only replay."
---

# 05 Scope

Phase 05 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `05 - Scope.md`: the journeys in 04 cut down to a first version. This is subtraction, not brainstorming. For a first-time founder the non-goals list is the single highest-value section of the whole spec; it is the defence against "while we're at it".

Incubyte builds a first version at a fixed price in about a month, so the scope is a fixed size and the cut has to land inside it: this is the one document where the answer is genuinely constrained rather than open. The size is your yardstick, not a subject to raise. Never write a price or a date into the document or say one aloud; the words are "a first version" and "a first phase".

Two yardsticks decide the cut, and they answer different questions.

**Does it fit?** A first version is about a month of build, and that is a ceiling rather than a target. Do not ask the founder how long they think something takes; use the month as your own sense of scale and write reasons in its terms: "this does not fit a first version alongside the invite flow".

**Which matters more?** When two steps both fit, the tiebreaker is what the end user needs to get value on their first visit, from day-one success in 02. A step a persona cannot reach that value without is a Must; a step that makes the experience better once they already have it is Later. Ask the question out loud in those terms, because it is the one a founder can actually answer.

Never ask what the founder can spend. If they volunteer a figure, note it in 13 and carry on with the cut unchanged.

## When more is wanted than fits

Expect this; a founder who has just told you four journeys usually wants all of them. The ceiling holds, and the Later list is what makes that a good conversation rather than a disappointing one.

Cut to what fits, then show the founder the Later list as the second phase it is: not features they lost, but the ones already written down and waiting, in an order that follows what users need next, ready to be specified when their turn comes. A founder who leaves with a buildable first version and a visible roadmap has more than one who leaves with a wish list nobody costed.

Never quietly overfill the Must list to keep a founder happy. An overfull first version is the failure this document exists to prevent, and an engineer reading 05 has no way to tell which Musts were real. Where a founder pushes hard on something that does not fit, record the push in 13 so Incubyte knows before kickoff.

## What the file contains

- Every step of every journey sorted into Must (v1), Later or Never, asked one step at a time, with a one-line reason each. The reason names which yardstick decided it: that it does not fit a first version, or that a persona reaches day-one value without it.
- An explicit non-goals list: things a reasonable engineer might assume are included and are not.
- The replay: a persona's first week told again using only Must items, written into the document. The replay is where missing steps show up before a developer finds them.

## Where founders go wrong

- Everything is a Must. Ask what happens to day-one success if a step is missing; if the user still walks away with it, the step is not a Must. The fixed size is the backstop: when the list stops fitting, something moves to Later, and the founder chooses which.
- They cut the operator's work. Approving, moderating and answering support still have to happen on day one; if they are Later, say who does them by hand and record it here.
- They agree to the cut in the abstract and put steps back during the replay. That is the replay doing its job; update the sort and run it again.
- Scope creeps back in through "obviously we also need". Write the obvious things into Must or the non-goals list; nothing stays implied.

## Done when

Every journey step has a home, the Must list fits a first version, the non-goals are written down, and the founder has retold a first week using only what is in Must and found nothing missing.

## Feeds

- 06: the Must list is exactly what gets acceptance criteria there.
- 11: every user-facing Must will need a screen.
- 13: any Must the founder is unsure about, and any operator work that is being done by hand for now.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
