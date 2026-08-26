---
name: product-overview
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"02 - Product Overview.md\": the one-page anchor: problem, who it is for, and day-one success."
---

# 02 Product Overview

Phase 02 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `02 - Product Overview.md`: one page, at most, that anchors everything after it. This document is the tiebreaker for every scope argument later, so it has to read like the founder's idea and nobody else's.

## Asking

Ask this one in prose. The product paragraph and the day-one success have to be in the founder's own words; a menu would put words in their mouth and this document is the tiebreaker for every later scope argument.

AskUserQuestion earns its place only when playing back a choice you have already heard, for instance offering two phrasings of the one-liner you drafted from what they said and asking which is closer.

## What the document must answer

- The problem, in the words of the person who has it.
- What the product is and who it is for, in one paragraph.
- The single change it makes in that person's life.
- Day-one success: what a user walks away with after their very first session.

## Where founders go wrong

- They write a pitch, not a description. Superlatives, market size and vision statements belong in the deck in `intake/`, not here. If the paragraph could describe three other products, it is not done.
- They name several audiences at once. Pin down the person the first version is for; the others may become personas in 03 or go to Later in 05.
- They describe features instead of the change. Ask what is different for the user afterwards, not what the screens do.

## Before offering next

The founder says it reads like their idea, and it fits on one page.

## Feeds

- 14: every domain term used here, in the founder's definition.
- 03: any kind of user mentioned in passing.
- 13: anything about the problem or audience the founder is still unsure of.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
