---
name: business-context
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"01 - Business Context.md\": the engagement frame: stage, decision-maker, existing assets, budget band and timeline."
---

# 01 Business Context

Phase 01 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `01 - Business Context.md`: the frame around the engagement, not the product. An estimable spec without a budget frame still produces a mismatched proposal. A ten-dollar-a-month self-serve product and a fifty-thousand-a-year enterprise sale need completely different first versions.

## Asking

Every answer here suits AskUserQuestion, including the first one, so open with it rather than easing in with prose. Who else is involved (just the founder, a cofounder, a small team, an agency already engaged), stage, who signs off on scope and money, budget band, what is driving the timeline. Offer bands rather than asking for a figure; a founder who will not name a number will often pick a range, and the ones who want to be exact can type it.

Even "what already exists that we should not redo" works as a multi-select: domain, brand, designs, code, content, a contract with another vendor. A founder reading that list remembers things a blank question would never surface.

## What the document must answer

- Who the founder is, who else is on the team, and who makes the final call on scope and money.
- Stage: idea, prototype, paying customers, funded round.
- What already exists that should not be redone: domain, brand, designs, code, content, contracts with other vendors.
- Budget band for the first version.
- Timeline pressure and what is driving it: a launch event, a funding milestone, a signed contract.

## Where founders go wrong

- They describe the product when asked about the business. Redirect gently; the product gets its own document next.
- They avoid the budget question. Ask it plainly and once. A declined answer is recorded in 13 as a decline, never guessed at.
- They forget assets already commissioned elsewhere. "What have you already paid someone for?" surfaces them.

## Before offering next

Budget and timeline are captured, or their decline is recorded in 13.

## Feeds

- 13: a declined budget or timeline; any team or decision-making detail the founder is unsure of.
- Budget and timeline become the tiebreakers when scope is cut in 05. Keep them concrete enough to be used that way.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
