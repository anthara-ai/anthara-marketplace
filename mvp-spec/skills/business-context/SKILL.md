---
name: business-context
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"01 - Business Context.md\": the engagement frame: who is involved, stage, and what already exists."
---

# 01 Business Context

Phase 01 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `01 - Business Context.md`: the frame around the engagement, not the product. Who is behind it, how far along they are, and what has already been paid for and should not be rebuilt.

Neither budget nor timeline is asked, here or anywhere. Scope is cut in 05 against a first version of roughly a month and against what the end user needs on day one, which are better yardsticks than a figure the founder is often guessing at, and asking a stranger their budget early reads as a sales qualification. Both are still worth having when offered: if the founder volunteers a budget or a real external deadline at any point in the interview, record it in this document.

## Asking

Every answer here suits AskUserQuestion, including the first one, so open with it rather than easing in with prose. Who else is involved (just the founder, a cofounder, a small team, an agency already engaged), stage, and who makes the final call on scope.

Even "what already exists that we should not redo" works as a multi-select: domain, brand, designs, code, content, a contract with another vendor. A founder reading that list remembers things a blank question would never surface.

## What the document must answer

- Who the founder is, who else is on the team, and who makes the final call on scope.
- Stage: idea, prototype, paying customers, funded round.
- What already exists that should not be redone: domain, brand, designs, code, content, contracts with other vendors.

## Where founders go wrong

- They describe the product when asked about the business. Redirect gently; the product gets its own document next.
- They forget assets already commissioned elsewhere. "What have you already paid someone for?" surfaces them.

## Before offering next

Who is involved, the stage, and what already exists are captured.

## Feeds

- 13: any team or decision-making detail the founder is unsure of.
- 05: existing assets narrow what needs building. Note anything already paid for that a Must might otherwise duplicate.
- 10: designs, a logo or brand work found here belong in the design direction too.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
