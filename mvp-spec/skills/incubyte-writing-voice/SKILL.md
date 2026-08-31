---
name: incubyte-writing-voice
description: Incubyte's sentence-level writing rules for anything a reader outside the team will see. Use when drafting or reviewing findings reports, client-facing summaries, engagement updates, proposals, documentation, website copy, case studies, or posts, and use it whenever a draft reads as AI-generated, over-compressed, aphoristic, or hard to parse on first read.
---

# Incubyte Writing Voice

Rules for how sentences are built. Apply them to anything a reader outside the team will see: findings reports, client-facing summaries, engagement updates, proposals, documentation, website copy, case studies, and posts.

This skill covers sentence construction only. Positioning, messaging pillars, structural arc, and channel tone live in the `brand-voice` skill. Where both are available, apply both, and let the rules here win on any question of how a sentence is written.

---

## The stance

Write like an engineer explaining a finding to a capable peer who does not yet have the context. Explain rather than perform. The reader should never have to re-read a sentence to work out what it refers to, and should never have to admire a sentence before understanding it.

---

## Rules

**One idea per sentence, and finish the sentence.** Do not stack two claims with a semicolon, and do not bury a second claim in parentheses. If a parenthetical is carrying real content, promote it to its own sentence.

**Name the thing.** Write "counts in this table" rather than "counts," and "capping the batch size" rather than "the size cap." Bare nouns and pronouns that lean on the previous sentence force the reader to do assembly work.

**Say the takeaway out loud.** Signposts are welcome: "The key takeaway is," "This matters because," "In practice this means." Do not compress a conclusion into an aphorism and trust the reader to unpack it. State the conclusion once, plainly, and do not restate it after an example has already proved it.

**Prefer the literal word.** "Feasible," not "affordable." "Reviews are primarily driven by volunteers," not "review falls to volunteers." No borrowed register, and no phrases like "the system's shape."

**Metaphors explain or they go.** A metaphor earns its place only when it is the clearest available explanation of the thing, and only when the piece pays it off. If it is there for texture or for sophistication, cut it and write the explanation instead.

**Connect the sentences.** Use "also," "since," "as a result," "similar." Adjacent sentences should read as one continuing argument, not as separate observations placed side by side.

**Plain sentence order, no emphatic constructions.** Subject, verb, object. Avoid cleft framing such as "X is what makes Y possible," avoid one-line drama, and avoid clipped fragments. Sentences run mid-length and complete. Passive voice is fine where it reads naturally, and "Similar insights are seen across all four repo groups" is good writing. Do not contort a sentence to avoid it.

**Slightly longer is fine.** Compression is not a virtue when it costs clarity. Words that carry a referent or a connector earn their place. Words that decorate do not.

**Every claim is traceable.** State what was observed, and say where it was observed. A sentence that reads as a maxim rather than a finding is either unsupported or in the wrong document.

---

## Calibration pairs

Avoid the first version in each pair. Write the second.

> **Avoid**: The evidence appendix: the item-level receipts behind each finding, straight from the records; every id links to its source.
>
> **Write**: The evidence appendix: List of item-level receipts behind each finding, with links to its source.

> **Avoid**: Counts are for inspection, never individual evaluation; the concentration is the system's shape (no repository requires an approval, so review falls to volunteers), and it holds across all four repo groups.
>
> **Write**: Counts in this table are a means to inspect the current state and not for individual evaluation. The key takeaway is that since no repository requires an approval, reviews are primarily driven by volunteers. Similar insights are seen across all four repo groups.

> **Avoid**: The size cap is what makes a review requirement affordable.
>
> **Write**: Capping the batch size also makes the review requirement feasible.

---

## Mechanics that affect the sentence

| Rule | Standard |
|------|----------|
| Em dashes | Do not use them. Rewrite the sentence, or split it in two. |
| Semicolons | Do not use them to join two claims. Write two sentences. |
| Contractions | Yes. They keep the prose human. |
| Passive voice | Fine where it reads naturally. Do not contort a sentence to avoid it. |
| Numbers | Spell out one to nine, use numerals for 10 and above and for all metrics. |
| Oxford comma | Yes. |
| Ellipsis | Avoid. |
| ALL CAPS | Never. Use **bold** for emphasis. |
| Bullets | Use them for the points that carry the message, so a reader who skims still gets them. Keep prose in paragraphs. |
| Bold | Bold a next step, a decision the reader has to make, and anything they must act on. Do not bold for emphasis alone. |

---

## Check before publishing

- Could a reader who skipped the previous sentence still parse this one?
- Is any sentence asking to be admired rather than understood?
- Did a semicolon or a parenthesis stand in for a second sentence that should have been written?
- Is a metaphor doing the job that an explanation should be doing?
- Is every claim traceable to something observed, rather than asserted as a maxim?

## How to fix a draft that fails these checks

1. Split every sentence that carries two claims.
2. Promote every parenthesis that carries real content into a sentence of its own.
3. Find every subject that is a bare noun or a pronoun pointing backwards, and name the thing instead.
4. Find the conclusions that arrive as a clever clause, and rewrite them as a plain statement with a signpost.
5. Remove every em-dash, then decide whether the sentence needs splitting.
6. Read adjacent sentences as a pair. If they read as two separate observations, add the connector that shows how the second follows from the first.
