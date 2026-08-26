---
name: product-overview
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"02 - Product Overview.md\": the one-page anchor: problem, who it is for, and day-one success."
---

# 02 Product Overview

Phase 02 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `02 - Product Overview.md`: one page, at most, that anchors everything after it. This document is the tiebreaker for every scope argument later, so it has to read like the founder's idea and nobody else's.

One page is a limit on the writing, not on the asking. This is the document where the interview goes deepest: everything after it inherits whatever is vague here, and a thin overview produces thin personas, thin journeys and a scope cut with nothing to cut against. Expect to ask well past the point where the founder has given you something that sounds like an answer, then write the short version.

## Asking

This is the one document where prose leads. The product paragraph, the problem in the words of the person who has it, and day-one success have to be the founder's own telling; a menu would put words in their mouth, and this document is the tiebreaker for every later scope argument.

Prose leading does not mean one question and a paragraph. Take each answer apart:

- A stated problem needs the moment it happens. When does someone hit this, what are they doing instead today, and what does that cost them? A founder who says "it's hard to keep track" has described a category; ask for the last time they watched someone struggle with it.
- A stated user needs a person. Who specifically, in what situation, at what point in their week? "People with dietary restrictions" is not yet an audience.
- Day-one success needs an observable moment. What has the user got in their hands at the end of their first session that they did not have before? If the answer is "they understand the app", keep asking.
- Anything the founder says that only makes sense inside their field is a 14 row and often a signal to look it up rather than ask.

AskUserQuestion still earns its place around the edges. Use it to narrow who the first version is for when the founder names several audiences, and to play back two or three phrasings of a one-liner you drafted from their words so they can pick the closest or write their own.

## What the document must answer

- The problem, in the words of the person who has it.
- What the product is and who it is for, in one paragraph.
- The single change it makes in that person's life.
- Day-one success: what a user walks away with after their very first session.

## Where founders go wrong

- They answer in categories and it sounds like an answer. "Helps people manage their diet" is a category; the product is in the specifics underneath it. This is the most common way this document ends up thin, and it is invisible unless you push.
- They write a pitch, not a description. Superlatives, market size and vision statements belong in the deck in `intake/`, not here. If the paragraph could describe three other products, it is not done.
- They name several audiences at once. Pin down the person the first version is for; the others may become personas in 03 or go to Later in 05.
- They describe features instead of the change. Ask what is different for the user afterwards, not what the screens do.

## Before offering next

The problem is stated as the person who has it would state it, with a moment it happens rather than a category. The audience is one identifiable person, not a list. Day-one success names something the user has or can do at the end of their first session. The founder says it reads like their idea, and it fits on one page.

## Feeds

- 14: every domain term used here, in the founder's definition.
- 03: any kind of user mentioned in passing.
- 13: anything about the problem or audience the founder is still unsure of.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
