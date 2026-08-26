---
name: compliance
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"09 - Rules and Compliance.md\": the compliance flags that shape the build, without giving legal advice."
---

# 09 Rules and Compliance

Phase 09 of the mvp-spec interview. The interview rules and package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `09 - Rules and Compliance.md`: only what shapes the build. The founder does not need statute names; the spec needs to record "this app handles children's health data" so the build treats it that way from day one. Retrofitting this is brutal.

This document flags. It does not advise. Where a flag has legal weight, say plainly that the founder should confirm it with counsel and record that as an open item in 13.

## What the document must answer

- Regulated data the product touches: health, payments, identity documents, financial records, location.
- Protected users: children imply parental consent and age rules; other groups may too.
- Jurisdictions: which countries or states users will be in, since the rules follow the user.
- Consent: what the user agrees to, when, and whether someone else consents on their behalf.
- Retention and deletion: how long things are kept and what the founder expects to happen when a user asks for their data to be removed.
- Anything the founder's industry imposes: professional licensing checks, mandatory reporting, audit trails.

## Where founders go wrong

- They assume compliance can be added later. Every sensitive field in 07 becomes a flag here now.
- They know the rule but not that it applies to them: "we are not a healthcare company, we just store mood entries".
- They over-scope it into a legal project. Keep to flags and the founder's expectations; Incubyte and counsel take it from there.

## Asking

Use AskUserQuestion for the flags, since a founder rarely volunteers them but recognises them on sight. Offer the regulated categories and let the founder pick the ones that apply: health data, payments, children or other protected users, identity documents, location. Ask jurisdictions the same way, from the places the founder has actually mentioned.

Ask in prose about anything the founder's own industry imposes, then record in 13 whatever needs a lawyer to confirm.

## Before offering next

Every sensitive flag in 07 is covered here, and jurisdictions and protected users are recorded.

## Feeds

- 13: every flag the founder needs to confirm with counsel; every jurisdiction they are unsure about.
- 06: any flag that implies a feature (consent screen, data export, deletion) that is not yet a Must; raise it with the founder and route the decision to 05 and 06.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
