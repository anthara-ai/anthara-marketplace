---
name: personas
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"03 - Personas.md\": every distinct kind of user, including who pays and who operates the product."
---

# 03 Personas

Phase 03 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `03 - Personas.md`: every distinct kind of user, with enough about each that journeys (04) and the permissions matrix (07) can be built from it. An email app has one persona. A children's mental-health app has at least three: the child, the parent, the therapist, each with different goals, screens and permissions.

## Asking

Use AskUserQuestion for nearly everything here. Tech comfort and how often each persona shows up are obvious menus. So is the operator question, and a menu is what makes it answerable: offer that the founder does it themselves, a team member does, a persona already listed does, or nobody does and the document should say why.

Even "who else uses this" works as a multi-select once one persona exists: offer the kinds of user this sort of product usually has and let the founder add their own. A founder who cannot answer "who are your users" in the abstract will recognise a missing persona on sight.

Prose is for what each persona is trying to get done, in the founder's words.

## What the document must answer

For each persona:

- What they are trying to get done.
- How comfortable they are with technology.
- How often they show up: daily, weekly, only when something is wrong.
- What brings them to the product and what would make them leave.

Across personas: a plain map of who pays, who uses, and who operates.

## Where founders go wrong

- They see only the obvious user. Two questions surface the rest: "Who pays, and is that the same person who uses it?" and "Who runs it day to day: approving people, moderating content, answering support?"
- They leave out themselves. There is almost always an operator or back-office persona, often the founder, and if it is missing from the spec it gets bolted on painfully later. The document must either contain the operator persona or state explicitly why there is none.
- They split one persona into several by demographics that change nothing about goals, screens or permissions. Merge those; a persona earns its place by needing something different from the product.

## Before offering next

An operator persona is present or explicitly ruled out with the reason written down, and every persona has the four answers above.

## Feeds

- 04: every persona here needs a journey there.
- 07: personas are the rows of the permissions matrix.
- 13: any persona the founder is unsure exists or unsure about.
- 14: role names specific to the founder's domain.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
