---
name: scope
description: This skill should be used when the mvp-spec interview reaches "05 - Scope.md", or when the founder wants to decide "what is in v1", "what to cut", "must have vs nice to have", "MVP scope", "non-goals", or "what we are not building". Sorts journey steps into Must, Later and Never and records the Must-only replay.
---

# 05 Scope

Phase 05 of the `mvp-spec` interview. The interview rules and package contract live in the `mvp-spec` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/mvp-spec/SKILL.md` first.

## Goal

Write `05 - Scope.md`: the journeys in 04 cut down to a first version. This is subtraction, not brainstorming. For a first-time founder the non-goals list is the single highest-value section of the whole spec; it is the defence against "while we're at it".

## What the document must answer

- Every step of every journey sorted into Must (v1), Later or Never, with a one-line reason each. Use the budget and timeline from 01 and the day-one success from 02 as the tiebreakers, and say so when they decide a call.
- An explicit non-goals list: things a reasonable engineer might assume are included and are not.
- The replay: a persona's first week told again using only Must items, written into the document. The replay is where missing steps show up before a developer finds them.

## Where founders go wrong

- Everything is a Must. Ask what happens to day-one success if a step is missing; if the user still walks away with it, the step is not a Must.
- They cut the operator's work. Approving, moderating and answering support still have to happen on day one; if they are Later, say who does them by hand and record it here.
- They agree to the cut in the abstract and put steps back during the replay. That is the replay doing its job; update the sort and run it again.
- Scope creeps back in through "obviously we also need". Write the obvious things into Must or the non-goals list; nothing stays implied.

## Before offering next

Every journey step is sorted with a reason, the non-goals list exists, and at least one journey has been replayed Must-only with the replay recorded in the document.

## Feeds

- 06: the Must list is exactly what gets acceptance criteria there.
- 11: every user-facing Must will need a screen.
- 13: any Must the founder is unsure about, and any operator work that is being done by hand for now.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `mvp-spec` skill.
