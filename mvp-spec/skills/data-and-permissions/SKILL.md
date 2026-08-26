---
name: data-and-permissions
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"07 - Data and Permissions.md\": the plain-language data model and the persona-by-noun permissions matrix."
---

# 07 Data and Permissions

Phase 07 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `07 - Data and Permissions.md`: what the app keeps track of, and who may see and change each thing. With more than one persona this is never trivial. Can the parent read the child's journal? Can the child see the therapist's notes? Those are product, ethical and legal decisions at once, and they are the founder's to make.

## What the file contains

- The nouns: each thing the app keeps track of, framed as "what does the app remember", what each contains, and where it comes from. Child profiles, mood entries, sessions, notes.
- The permissions matrix: personas down the side, nouns across the top, each cell see, edit or none, asked cell by cell. Where a cell depends on a relationship (a therapist sees only their own clients), say so in the cell.
- Sensitive fields flagged: health, children, payments, identity, anything the founder would not want leaked.

## Where founders go wrong

- They think permissions are obvious. Walk every cell out loud anyway; the surprising ones are the point.
- They answer for the happy relationship and forget the broken one: the parent who is no longer the guardian, the therapist who leaves the practice. Ask who loses access and when.
- They are silent on a cell. An unanswered cell is a row in 13, never a silent "none".
- They describe storage rather than meaning. Keep nouns in founder language; engineers translate.

## Done when

No cell in the matrix is your guess, every noun a feature touches is listed with what it contains and where it comes from, and every sensitive field is flagged.

## Feeds

- 09: every sensitive flag here must have a matching flag there.
- 13: every unanswered cell, with what depends on it.
- 14: every noun whose name is specific to the founder's domain.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
