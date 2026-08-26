---
name: scope
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"05 - Scope.md\": the Must, Later and Never sort, the non-goals list and the Must-only replay."
---

# 05 Scope

Phase 05 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `05 - Scope.md`: the journeys in 04 cut down to a first version. This is subtraction, not brainstorming. For a first-time founder the non-goals list is the single highest-value section of the whole spec; it is the defence against "while we're at it".

## Asking

Open by asking the budget band, before the sort. Frame it as what it is: the tiebreaker for the cuts about to be made, not a qualification. Offer bands rather than asking for a figure, and always include an option meaning "I would rather not say", which goes to 13 as a decline. A founder who declines is not pressed again; day-one success from 02 carries the sort on its own.

The rest is almost entirely AskUserQuestion. Walk the journey steps and sort each one: Must, Later, Never. Asking the same three options step after step is what makes a long sort bearable, and it stops a founder answering "well, sort of" to a question that needs a decision. Cluster related steps into one call of up to four where the founder is moving quickly.

Offer the non-goals as a multi-select too: the things a reasonable engineer might assume are included. A founder recognises what they do not want far faster than they generate it.

Prose is for the reason behind a cut that surprised you, and for the replay itself.

## What the document must answer

- Every step of every journey sorted into Must (v1), Later or Never, with a one-line reason each. Use the budget band and the day-one success from 02 as the tiebreakers, and say so when they decide a call.
- The budget band for the first version, asked here rather than in 01 because this is where it is used.
- An explicit non-goals list: things a reasonable engineer might assume are included and are not.
- The replay: a persona's first week told again using only Must items, written into the document. The replay is where missing steps show up before a developer finds them.

## Where founders go wrong

- Everything is a Must. Ask what happens to day-one success if a step is missing; if the user still walks away with it, the step is not a Must.
- They cut the operator's work. Approving, moderating and answering support still have to happen on day one; if they are Later, say who does them by hand and record it here.
- They agree to the cut in the abstract and put steps back during the replay. That is the replay doing its job; update the sort and run it again.
- Scope creeps back in through "obviously we also need". Write the obvious things into Must or the non-goals list; nothing stays implied.

## Before offering next

The budget band is captured or its decline recorded in 13, every journey step is sorted with a reason, the non-goals list exists, and at least one journey has been replayed Must-only with the replay recorded in the document.

## Feeds

- 06: the Must list is exactly what gets acceptance criteria there.
- 11: every user-facing Must will need a screen.
- 13: any Must the founder is unsure about, and any operator work that is being done by hand for now.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
