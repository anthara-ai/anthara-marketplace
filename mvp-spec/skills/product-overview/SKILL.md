---
name: product-overview
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"02 - Product Overview.md\": the one-page anchor: problem, who it is for, and day-one success."
---

# 02 Product Overview

Phase 02 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `02 - Product Overview.md`: the anchor everything after it is judged against, and the tiebreaker for every scope argument later, so it has to read like the founder's idea and nobody else's.

This is where the tree goes deepest. Everything after it inherits whatever is vague here, and founders answer in categories that sound like answers. Keep following branches well past the first thing that sounds complete, then write it complete and as short as completeness allows.

## Menus

Ask even the open questions through the tool. For the problem, offer the two or three moments the domain suggests people hit it and let the free-text answer carry the founder's own. For who it is for, offer the people they have already mentioned. For the paragraph and for day-one success, draft two or three versions from what they have said and let them pick, edit or replace. The words in the file are theirs either way, because they review the file.

## What the file contains

- The problem, in the words of the person who has it.
- What the product is and who it is for, in one paragraph.
- The single change it makes in that person's life.
- Day-one success: what a user walks away with after their very first session.

## Where founders go wrong

- They answer in categories, and it sounds like an answer. Ask for the last time they watched someone have the problem; the product is in what they say next.
- They write a pitch, not a description. Superlatives, market size and vision statements belong in the deck in `intake/`, not here. If the paragraph could describe three other products, it is not done.
- They name several audiences at once. Pin down the person the first version is for; the others may become personas in 03 or go to Later in 05.
- They describe features instead of the change. Ask what is different for the user afterwards, not what the screens do.

## Done when

You could describe the product to a stranger in a paragraph, name the one person it is for and the moment their problem happens, and say what they walk away with after their first session, and the founder would correct nothing. "Helps people manage their diet" is not there yet; the product is in the specifics underneath.

## Feeds

- 14: every domain term used here, in the founder's definition.
- 03: any kind of user mentioned in passing.
- 13: anything about the problem or audience the founder is still unsure of.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
