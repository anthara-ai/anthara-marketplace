---
name: user-journeys
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"04 - User Journeys.md\": one end-to-end narrative per persona, with cross-persona handoffs and unhappy paths."
---

# 04 User Journeys

Phase 04 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `04 - User Journeys.md`: one end-to-end story per persona in plain narrative, each with a Mermaid diagram of the same flow. For a non-technical founder the journeys are the raw material of the spec; features fall out of them in 05 and 06.

## Asking

The narrative is prose; a story told through menus is not a story. Everything around it is a menu: where a journey starts, how a handoff reaches the other side and when, which of the usual unhappy paths apply.

## What the file contains

For each persona, as a story: how they first arrive, what onboarding looks like, what a normal day with the product looks like, and what brings them back.

Across personas: every handoff where one persona's action reaches another. Each handoff names both sides and how the information moves: pushed by a notification or pulled on next login, and when.

Unhappy paths flagged inline as the story is told: the invite that is never accepted, the payment that fails, the entry that signals something is wrong. Flag them here; specify their handling in 06.

## Where founders go wrong

- They skip onboarding and start at "then the user logs in". Onboarding is where the complexity hides: invites, consent, connecting personas to each other. Ask for the very first minute.
- They describe handoffs from one side only. "The therapist sees the mood entry" is half a handoff. Ask how it gets there and when the therapist finds out.
- They tell the happy path as if it always happens. Ask what goes wrong at each step and note it; do not solve it yet.
- They narrate features rather than a day. Keep asking what the person does next.

## Done when

You could tell each persona's story from before they have an account to their third week, including what goes wrong along the way, without inventing a step, and every handoff names both sides and how it reaches the other.

## Feeds

- 05: the journey steps are what gets sorted into Must, Later and Never.
- 06: every unhappy path flagged here needs handling there.
- 07: the nouns the app keeps track of appear in these stories; note them.
- 08: where each persona physically is when they use the product.
- 13: any step the founder cannot yet describe.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
