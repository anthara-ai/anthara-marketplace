---
name: features
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"06 - Features and Acceptance Criteria.md\": plain done-means statements and unhappy-path handling for every Must item."
---

# 06 Features and Acceptance Criteria

Phase 06 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `06 - Features and Acceptance Criteria.md`: every Must item from 05 made estimable. This is the single biggest upgrade from "spec" to "estimable spec". Founders can produce acceptance criteria when asked about one feature at a time.

## Asking

Lean on AskUserQuestion for the decisions inside a feature, which are the ones founders skip: where the paywall sits, whether there is a trial, what happens to a user's data when they delete their account, whether an invite expires, who can cancel. Offer the realistic options rather than asking an open question a founder cannot answer cold.

Unhappy paths work well as a multi-select: offer the ways this kind of feature usually fails, including the ones specific to this domain rather than only the generic payment-and-password set, and let the founder pick and add. That surfaces far more than "what could go wrong here?".

Prose is for the done-means statements themselves, which are the founder's own description of the feature working.

## What the document must answer

For each Must feature:

- A plain description and which persona and journey step it serves.
- Two to four done-means statements in founder language: "a parent can invite a child by email; the child can join without creating a password."
- What happens on the unhappy paths flagged in 04 and any found here.

Across features:

- Account lifecycle: invitations, role changes, offboarding, and account deletion, which is legally required in most places and almost never in the founder's head.
- Monetization mechanics, if money changes hands: where the paywall sits, whether there is a trial, what is free. Not the business model; the placement, because it changes the journeys.
- Domain-specific edge cases that are really product decisions. In a children's mental-health app, what happens when a child's entry signals crisis is not an edge case; it is a safety-critical decision the founder makes here.

## Where founders go wrong

- They never volunteer unhappy paths. Ask for each feature: what if it fails, what if the other person never responds, what if the user changes their mind.
- Done-means statements drift into implementation ("uses OAuth"). Keep them to what a user can do or see.
- They specify Later items because they are excited about them. Nothing non-Must belongs in this document; move it to 13 or 05.
- They treat deletion and offboarding as someone else's problem. Ask directly what a user who leaves takes with them and what disappears.

## Before offering next

Every Must item in 05 has a description, a persona and step, and two to four done-means statements; unhappy paths, lifecycle and monetization are covered; nothing non-Must is present.

## Feeds

- 07: every noun a feature creates, reads or changes.
- 08: every rented service a feature implies: payments, email, SMS, video, calendar.
- 09: any feature that touches regulated data or protected users.
- 11: every user-facing feature needs a screen.
- 13: any unhappy path the founder has not decided.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
