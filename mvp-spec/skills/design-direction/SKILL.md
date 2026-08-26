---
name: design-direction
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"10 - Design Direction.md\": reference apps, the five-second feeling, existing brand assets and the app voice."
---

# 10 Design Direction

Phase 10 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `10 - Design Direction.md`: enough direction that Incubyte's designers start from the founder's taste rather than their own, captured in founder language, not designer language.

## Asking

Use AskUserQuestion for the style pick when a founder has no reference apps to name: clean and minimal, soft and playful, glassy and translucent, bold and corporate. Use it for the five-second feeling per persona, and for the voice: warm and simple, clinical, cheeky.

Ask in prose which apps they would steal the look of and what specifically they like about each, and get the two sample lines approved as written text rather than as a choice.

## What the document must answer

- Reference apps: two or three apps whose look the founder would steal, and what specifically they like about each. "Like Calm, not like Excel" communicates more than any vocabulary. For founders without references, offer a plain menu: clean and minimal, soft and playful, glassy and translucent, bold and corporate.
- The five-second feeling: what a user should feel when the product first opens. Calm and safe, energetic, professional. Per persona where it differs: playful for the child, reassuring for the parent, efficient for the therapist.
- What exists already: logo, colours, a name, a typeface, or whether naming and branding are part of the work. Cross-check with the assets recorded in 01.
- Voice: how the app talks. Warm and simple, clinical, cheeky. Capture it as two sample lines written in that voice, a welcome message and an error message, and get both approved word for word.

## Where founders go wrong

- They reach for design vocabulary they do not quite mean. Return to reference apps and feelings.
- They have strong opinions about colour and none about voice. Voice quietly drives every screen's copy; do not skip it.
- They give one feeling for a product with three personas. Ask per persona.

## Before offering next

Reference apps or a style pick are recorded, the five-second feeling is captured per persona where it differs, existing assets are listed, and the two sample lines are approved.

## Feeds

- 11: screens follow the voice; use the approved lines where they fit.
- 13: branding work not yet decided; assets the founder thinks exist but cannot produce.
- 01: any existing asset discovered here that 01 missed.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
