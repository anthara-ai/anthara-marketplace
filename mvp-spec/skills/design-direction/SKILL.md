---
name: design-direction
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"10 - Design Direction.md\": reference apps, the five-second feeling, existing brand assets and the app voice."
---

# 10 Design Direction

Phase 10 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `10 - Design Direction.md`: enough direction that Incubyte's designers start from the founder's taste rather than their own, captured in founder language, not designer language.

## What the file contains

- Visual style: the decision is a style, and apps are only there to make a style name mean something. Offer three or four styles that fit this product, named in plain words a founder would use and chosen for this product rather than from a stock list, each with one or two widely known apps in the option's description so the founder can picture it; "calm and minimal, like Calm or Headspace" is the shape. Ask which they like, then what specifically they like about it, in their words. Never ask which app to copy. A founder who volunteers an app they admire is giving an example of a style; the file records the style first and the apps as illustrations, and both are recorded because either alone is ambiguous to a designer.
- The five-second feeling: what a user should feel when the product first opens. Calm and safe, energetic, professional. Per persona where it differs: playful for the child, reassuring for the parent, efficient for the therapist.
- What exists already: logo, colours, a name, a typeface, or whether naming and branding are part of the work. Cross-check with the assets recorded in 01.
- Voice: how the app talks. Warm and simple, clinical, cheeky. Capture it as two sample lines written in that voice, a welcome message and an error message, and get both approved word for word.

## Where founders go wrong

- They reach for design vocabulary they do not quite mean. Return to the named styles with their example apps, and to feelings.
- They have strong opinions about colour and none about voice. Voice quietly drives every screen's copy; do not skip it.
- They give one feeling for a product with three personas. Ask per persona.
- They handed over a Figma file, a live site or a logo at intake and are then asked to describe their taste from scratch. Open what is in `intake/` first, read the style out of it, and ask them to confirm or correct it.

## Done when

A designer could start from the founder's taste rather than their own: a named style with the apps that illustrate it and what the founder likes about it, a feeling per persona where they differ, what already exists, and two approved lines in the app's voice.

## Feeds

- 11: screens follow the voice; use the approved lines where they fit.
- 13: branding work not yet decided; assets the founder thinks exist but cannot produce.
- 01: any existing asset discovered here that 01 missed.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
