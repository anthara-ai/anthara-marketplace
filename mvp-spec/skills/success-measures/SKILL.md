---
name: success-measures
description: This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes "12 - Success Measures.md": three to five measures and what the product must record for each.
---

# 12 Success Measures

Phase 12 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `12 - Success Measures.md`: three to five things the founder should be able to see after launch to know the product is working, and for each one what the product has to record to make it visible. Instrumenting at build time is nearly free; adding it later is expensive.

## What the document must answer

For each measure:

- What the founder wants to see, in plain words: sign-ups per week, entries logged per child per week, therapists inviting families.
- Why it means the product is working, tied back to day-one success in 02.
- What the product must record for it to be visible, and which feature in 06 does the recording.
- Roughly what good looks like in the first months, if the founder has a view. "I don't know" is fine here and goes to 13.

## Where founders go wrong

- They pick vanity numbers: downloads, page views. Ask what number going up would change a decision they make.
- They name a measure nothing records. If no feature captures it, either a Must is missing or the measure is not a v1 measure; take it to the founder.
- They list ten. Cut to the three to five they would actually check.

## Before offering next

Three to five measures are recorded, and each names what gets recorded and by which feature.

## Feeds

- 06: recording a measure may need a done-means statement on an existing feature; add it and tell the founder 06 changed.
- 13: targets the founder cannot yet set; measures that need a feature not in Must.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
