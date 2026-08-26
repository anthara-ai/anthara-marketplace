---
name: platform
description: "This skill is one step of the mvp-spec founder interview and is invoked by the `start` skill, not directly. It writes \"08 - Platform, Integrations and Content.md\": platform per persona, rented services and day-one content owners."
---

# 08 Platform, Integrations and Content

Phase 08 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this phase was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `08 - Platform, Integrations and Content.md`: the three sets of decisions that swing build cost more than almost anything else and that otherwise get made silently by the developer.

## Asking

All menus. Platform per persona, offline, interruptions, buy-or-build for each rented service, and the launch-day content as a multi-select named from the domain. Owners are picked from the people in 01 and 03.

## What the file contains

- Platform per persona, decided by where they physically are when they use the product: a child on a tablet at home, a therapist on a laptop between sessions. Phone app, website or both, and why. Whether anything must work offline. Whether anything must interrupt the user: notifications, reminders, alerts.
- Rented services: payments, email, SMS, video calls, calendar sync, sign-in with Google or Apple, maps, file storage. Each one named so the spec can say "buy, don't build".
- Day-one content: what the product needs to contain on launch day and who supplies each item. Exercises, a therapist directory, help text, copy, imagery, terms of service.

## Where founders go wrong

- They assume rented things are hard and hard things are easy. Listing the rented services makes the real work visible.
- They pick a platform from preference rather than from where the user is. Ask about the moment of use, not the device they like.
- They ship an empty app. "The app is built but has nothing in it" is one of the most common launch failures and a one-question fix at spec time. Every content item needs a named owner and a rough date.
- They forget that notifications are a product decision with cost. Ask what must interrupt a user and what can wait for next login.

## Done when

Every persona has a platform decided by where they are when they use the product, every rented service is named, and every piece of launch-day content has a named owner.

## Feeds

- 09: payments, messaging to children, and health data all raise flags there.
- 13: content items without an owner; platform decisions the founder is deferring.
- 14: service and platform terms the founder uses loosely.

## Then

Write the file, tell the founder which file to review and that saying next moves the interview on, then continue with the loop in the `start` skill.
