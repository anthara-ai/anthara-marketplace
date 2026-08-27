---
name: report
description: "This skill is the final document of the mvp-spec founder interview and is invoked by the `start` skill after document 12, not directly. It writes \"15 - Incubyte's Read.md\": the product summarised, an elevator pitch, Incubyte's read on scope, and what public research turned up about comparable products."
---

# 15 Incubyte's Read

Step 15 of the mvp-spec interview. How the interview works and the package contract live in the `start` skill; if this step was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/start/SKILL.md` first.

## Goal

Write `15 - Incubyte's Read.md`: the one document in the package that is Incubyte's opinion rather than the founder's record, and the only one that may carry research and judgement. Everything else records what the founder decided; this advises. Incubyte is a service provider, so the advice is candid and never a gate. If the founder wants all of it built, Incubyte builds all of it.

Write it for the founder, to be read in ten minutes, in the language they used in the room.

## What the file contains

In this order:

- An attribution line at the top: prepared from the interview and public research, and Incubyte's team goes through it with the founder before kickoff.
- The product in a few paragraphs, from 02, 03 and 04: what it is, who it is for, what a first user walks away with.
- An elevator pitch: two or three sentences the founder could say aloud to a stranger, in their own framing from 02.
- The scope read. Open with the size line from 05. Then take each good-to-have the founder pulled into the first version, and each note tagged "for the report" in 13, and for each one say what the item is, why Incubyte would build it later rather than now, what signal from real users would say it is time, roughly what it costs in screens and decisions, and whether this is a call the founder should make now or one their users should make for them. Reference items by their 05 inventory number instead of restating them.
- Market findings, as findings and not a verdict, so the founder can say in one sentence, with sources behind it, what already exists for their user, where it falls short, and what theirs does differently.
- A door at the end: if any of this changes the founder's mind, they say so and the spec is updated.

## How to write it

Read 01 to 14 in full before writing anything, then `15.01 - Research Notes.md`, where the interviewer recorded what they found about the domain and market, each note with its source and date. Then search the web to fill the gaps and check anything from the notes you will rely on, shaped by what the product turned out to be rather than what it sounded like at intake. An interview can span several sessions and the earlier context is stale; the notes are what survived. Search until you could write the founder's one sentence for them, then stop.

Every claim about a competitor or the market carries a source link the founder can open. Keep the findings short, and treat the shortness as a feature rather than a gap to fill. Never write "validated" or "not validated", and never a thumbs up or down; report what is out there and let the founder decide what it means.

If web search is unavailable, say so in the attribution line and leave the findings out. Never name a product or make a market claim you did not find yourself or read in a sourced note in 15.01; a note with no source is not a claim you can make.

The scope read is reasoning, not verdicts. A good-to-have the founder pulled in stays pulled in; say what Incubyte sees and why, and leave the choice where it is. Where you disagree with the spec, that disagreement belongs here as Incubyte's view and the spec stays as the founder wrote it. Nothing in this file may contradict 01 to 14.

Point at the spec files rather than restating them. Never quote a price or a delivery date. It is fine to say a first version is larger than typical and that a phasing conversation is worth having before kickoff.

Plain, warm, direct. No consultant vocabulary, no hedging that sounds like Incubyte would rather not build something.

## Done when

A founder could read it in ten minutes and come away knowing what Incubyte would build first, what it would wait on and why, what the market around them looks like, and how to say in one sentence what already exists, where it falls short and what theirs does differently. Every market claim has a source they can check. Nothing in it contradicts 01 to 14.

## Feeds

- 05 and whatever depends on it: if the founder changes their mind after reading.
- 13: anything the research raised that the founder should decide.

## Then

Write the file, tell the founder which file to review and that saying next moves to packaging. If they want changes to the spec, make them through the document skills, rewrite this file to match, and offer next again. Then continue with the loop in the `start` skill.
