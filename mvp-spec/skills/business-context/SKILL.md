---
name: business-context
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"01 - Business Context.md\": the engagement frame: who is involved, stage, and what already exists."
---

# 01 Business Context

Phase 01 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `01 - Business Context.md`: the frame around the engagement, not the product. Who is behind it, how far along they are, and what has already been paid for and should not be rebuilt.

The document has three sections and nothing else: who is involved, stage, and what already exists. Write only what the founder said. A section with nothing in it does not belong in the file, and neither does a note explaining what the interview did not cover.

## What the file contains

- Who the founder is, who else is on the team, and who makes the final call on scope.
- Stage: idea, prototype, paying customers, funded round.
- What already exists that should not be redone: domain, brand, designs, code, content, contracts with other vendors.

## Where founders go wrong

- They describe the product when asked about the business. Redirect gently; the product gets its own document next.
- They forget assets already commissioned elsewhere. "What have you already paid someone for?" surfaces them.

## Done when

You could introduce the founder and their team to an Incubyte engineer, say how far along they are and who decides scope, and list what already exists that must not be rebuilt, without guessing at any of it.

## Feeds

- 13: any team or decision-making detail the founder is unsure of. If the founder volunteers a budget or a deadline unprompted, it goes here too, as a one-line note. Never raise either subject.
- 05: existing assets narrow what needs building. Note anything already paid for that a first-version feature might otherwise duplicate.
- 10: designs, a logo or brand work found here belong in the design direction too.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
