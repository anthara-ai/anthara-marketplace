---
name: plain-technical-voice
description: Incubyte's plain technical writing rules for sentences and headings. Short sentences, active voice, simple verb forms, one name for one thing and no idioms. Use when writing client-facing deck text, findings reports, method sheets, caveats or documentation that must be clear on the first read, including by readers whose first language is not English, and whenever a draft has long sentences, passive constructions, idioms or changing names for one thing.
---

# Plain Technical Voice

Incubyte's rules for how sentences and headings are built. They make text clear on the first read, also for readers whose first language is not English. Apply them firmly, but do not apply them so strictly that the text becomes unnatural.

This skill covers sentence construction only. The shape of each surface (running prose or one claim per line) comes from the template or document you are filling. Where the two disagree on how a sentence is written, this skill wins.

The rules apply to prose only. Do not change code, commands, file paths, identifiers, dataset ids, status names, log output, error text or quoted text.

---

## Words

**Use one word for one meaning.** When you name a thing, use the same name each time. Do not change "pull request" to "PR" to "change" for the same thing in one document. If two words name two populations, keep them different on purpose.

**Use the simple, common word.** "Use", not "utilize" or "leverage". "Start", not "initiate". "Help", not "facilitate". "Show", not "demonstrate". "Examine", not "walk" or "review" when you mean "look at closely".

**Use a word only in its most common meaning.** If a word has two meanings, use it for one meaning only in the document. For example, if "run" means a CI run, do not also use it for "manage".

**No idioms, slang or figures of speech.** Not "goes quiet", "bottleneck", "moves the needle" or "the shape of the system". Write the literal fact.

**Technical words are permitted.** "Merge", "deploy", "commit", "pipeline", "p85", the names of tools, statuses and services. Explain a technical word once if the reader is not an engineer.

**Do not use "should", "might" or "could" for an instruction.** Write the instruction. For a real uncertainty, use "can" or "possible", and say what is uncertain.

---

## Sentences

**Write one topic in one sentence.** A sentence with two claims becomes two sentences.

**Keep an instruction to 20 words or fewer, and a description to 25 words or fewer.** A list of names in one sentence is the only exception.

**Use the active voice.** Write "One account moved 63 issues to Done", not "63 issues were moved to Done". In a description, use the passive voice only when the actor is unknown. Never use it in an instruction.

**Use only the simple verb forms.** Use the infinitive, the imperative, the simple present, the simple past and the simple future. Use the past participle only as an adjective ("the merged pull request"). Do not use auxiliary verbs to make complex verb forms. Write "the team closed 63 issues", not "63 issues had been closed" or "the team would have closed".

**Do not make noun clusters of more than three words.** Write "the time to the first review of a pull request", not "pull request first review wait time".

**Use the -ing form of a verb only in a technical noun.** Write "when you merge the change", not "when merging the change". An -ing word is permitted as a technical noun or as a modifier in one ("secret scanning", "the scheduled-security-scan workflow").

**Do not leave out parts of a sentence.** Keep the subject, the verb and the articles ("the", "a", "this"). Do not drop them to make text shorter.

**Use a verb for an action.** Write "configure the server", not "perform the configuration of the server".

**Do not join clauses with a semicolon or a dash.** Write two sentences. Do not put a second claim in parentheses.

**Use the tense that matches the record.** Past events take the past tense. Do not turn a pattern from one period into a present-tense rule ("the board does not move") when the records show only that period.

**Name the base of every share.** Write "21.1% of the large pull requests with linked CI runs", not "21.1% of large pull requests", when the base is the smaller set.

**Say what the records show, not why.** Write "merged fast, and most merges had no review", not "merged fast because nothing stops a change". Write a cause only when the analysis tested it.

---

## Headings

A heading is the first thing the reader sees, so it carries the takeaway and nothing else.

**State the takeaway, not the layout.** A heading names the core topic or the action. Write "Most merges skip review", not "Review findings".

**Never describe the structure.** Do not describe the slide, the page or the table. Do not count its items. Write "Require review, cap size, link tickets", not "Three moves for three constraints". Write "How we measured, and the limits", not "Where the numbers come from".

**Six words or fewer.** Use sharp, active verbs. Everything the heading does not say goes in the lede under it.

**No figures in a heading.** A number belongs in the lede, where its evidence travels with it.

These rules apply to every heading: the title, each slide heading and each appendix or section heading. Kickers and column headers are labels, not headings. A column header names what the column holds and its unit.

---

## Instructions and recommendations

1. Write one instruction in one sentence.
2. Start each instruction with an imperative verb: "Set", "Agree", "Examine", "Connect".
3. Put the steps in the order that the reader does them.
4. Use a vertical list when an instruction or a description is complex.
5. Put a warning or a caution before the step it applies to. Start it with a clear command or condition: "Do not merge before CI passes." or "If the run fails, stop the rollout."
6. Write an expected outcome as a target ("Target: below 50%"), not as a prediction.

---

## Paragraphs

1. Put the most important information first.
2. Write one topic in one paragraph.
3. Keep a paragraph to six sentences or fewer.
4. Give a reason in a separate sentence: "Do this. This prevents X." Use "As a result," or "For this reason," to connect two sentences, not "thus" or "hence".

---

## Calibration pairs

Avoid the first version in each pair. Write the second.

> **Avoid**: The board goes quiet while code ships, then a bulk sweep closes everything at once.
>
> **Write**: The board had 4 status changes in the first four weeks of August. On 2 September, one account moved 63 issues to Done in 9 minutes.

> **Avoid**: Large PRs fail CI 3.6x as often, so capping size will cut failures.
>
> **Write**: Pull requests over 1,000 lines were 3.6 times as likely to have a failed CI run. Target: fewer merges over 1,000 lines.

> **Avoid**: Counts are for inspection, never evaluation; review falls to a handful of volunteers.
>
> **Write**: This table shows the current state. It is not for the evaluation of a person. One person gave 40.4% of the approvals.

---

## Mechanics

All rows are Incubyte house choices that keep decks consistent.

| Rule | Standard |
|------|----------|
| Em dashes | Do not use them. Write two sentences. |
| Semicolons | Do not use them to join two claims. Write two sentences. |
| Contractions | No. Write "do not", "cannot". |
| Passive voice | Only in a description, and only when the actor is unknown. |
| Numbers | Numerals for all metrics and counts. Words for one to nine only in general prose. |
| Oxford comma | No. Write "A, B and C". |
| Ellipsis | Do not use. |
| ALL CAPS | Never for emphasis. Use **bold**. Status names keep their own case. |

---

## What not to change

1. A number, an id, a status name or a quoted string stays exactly as it is.
2. A warning, a caveat or a limit keeps its full content. Do not remove information to obey a word limit.
3. When the reader asks for a full explanation, give it. Use these rules, but do not make the answer shorter than the topic needs.

---

## Check before publishing

- Is any heading longer than six words, or does it describe the layout or count items?
- Does any heading carry a figure?
- Is any sentence longer than 25 words, other than a list of names?
- Does any sentence carry two claims, or a claim inside parentheses?
- Does one thing have two names, or one name cover two things?
- Is any sentence passive where the actor is known?
- Does any verb use a complex form ("has been", "would have", "is being")?
- Is any -ing word used as a verb or a plain noun?
- Is any noun cluster longer than three words?
- Does any sentence state a cause, a standing pattern or a predicted effect that the records do not show?
- Does every share say what it is a share of?

## How to fix a draft that fails these checks

1. Split every sentence that carries two claims, or that is over the word limit.
2. Replace each idiom with the literal fact.
3. Make one list of the names in the draft, and use one name for each thing.
4. Rewrite each passive sentence with the actor as the subject, and each complex verb form as a simple tense.
5. Rewrite each -ing verb as a clause with a subject ("when you merge"), and split each noun cluster of four or more words with "of" or "for".
6. Change each causal "because" to what the records show together, unless the analysis tested the cause.
7. Remove every em dash and every semicolon.
