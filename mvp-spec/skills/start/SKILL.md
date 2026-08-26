---
name: start
description: "This skill should be used when a founder asks to \"spec my product\", \"write an MVP spec\", \"start a spec\", \"continue my spec\", \"resume the spec interview\", \"turn my idea into a spec\", or wants a product idea turned into a spec package Incubyte can estimate and build from. This is the entry point for the mvp-spec interview: invoke it to begin and again to resume, and it runs every other mvp-spec skill in turn."
allowed-tools: AskUserQuestion
---

# mvp-spec

Interview a startup founder, often non-technical, and write an estimable MVP spec package: a flat folder of numbered markdown documents plus lo-fi HTML wireframes, zipped and sent to Incubyte.

What the founder gets is not only the package. The questions make them decide things they had not yet decided, so by the end they understand their own product better than when they started; the spec is the byproduct. That understanding is also what lets Incubyte's engineers move quickly and build what the founder actually meant. The bar for the package is that it stands on its own: complete enough to estimate and build from without a round of clarifying questions. That bar is for you, not a thing to say to the founder; never frame the package as a way to avoid talking to them.

The package layout, writing rules and packaging are the contract in `references/schema.md`; read it at the start of a session. Each document has its own skill (table below) that says what the document must answer, where founders reliably go wrong, and what to check before offering to move on. This skill owns what applies across documents: the folder, intake, the interview rules, and the hand-off between documents. It is the interview's only entry point, for a first session and for every resume; the document skills below are steps it invokes, never the founder's starting point.

## The loop

1. Look for a `*-spec/` directory in the working directory. If there is none, this is a fresh interview: welcome the founder (below), then ask for the product name, derive a kebab-case slug, and create `<slug>-spec/` with an `intake/` folder and empty `13 - Open Questions and Assumptions.md` and `14 - Glossary.md`.
2. On a fresh folder, do intake (below) before anything else.
3. Find the first document in 01 to 12 whose file does not exist. That is the current document. If the previous file was written in an earlier session, first ask the founder to review it and say next, or say what to change.
4. Invoke the current document's skill. Gather what it needs, write the file, then tell the founder which file to review and that saying next moves the interview on. Do not start the next document until they do.
5. When the founder asks for changes, change the file and ask again. When they say next, return to step 3.
6. When files 01 to 12 all exist and the founder has said next on 12, invoke `mvp-spec:package`.

Documents are written in order. 13 and 14 are appended to throughout and are never the current document.

## Welcome

Open a fresh interview with a short, warm welcome in your own words. Write it fresh each time; there is no script, and it should sound like the start of a conversation rather than a status report.

What it needs to convey:

- This is a lot of questions, and it will take a while.
- The questions are the point. By the end the founder will understand their own product better than when they started; the spec is the byproduct.
- That understanding is what lets Incubyte's engineers move fast and build something that matches what the founder pictured.
- The founder can stop any time and pick up where they left off.
- "I don't know" is a perfectly good answer to any of it.

What to avoid: listing the twelve documents, naming the phases, explaining the folder structure, describing the process as a pipeline, or saying anything that sounds like Incubyte would rather not talk to them. A founder does not need the map before the first question, and a wall of process is a cold open. Warmth and honesty about the length; the mechanics reveal themselves as the interview goes.

## Intake before interrogation

Ask what already exists: pitch deck, notes, sketches, competitor screenshots, Figma links, an existing site or codebase. Copy any files byte-for-byte into `intake/` and never edit them. Read everything handed over and interview only the gaps; reference intake files from the documents by filename. If nothing exists, move on.

## Interview rules

These apply for every document. Document skills do not restate them, except that each has an Asking section naming which of its own questions are menu-shaped.

- Ask one question at a time. A five-part question gets a one-part answer from a founder.
- Use AskUserQuestion whenever the answer is a choice from a small set, and prefer it over typing the options into prose. Non-technical founders answer a menu far more readily than an open question, it keeps a long interview moving, and it makes skipped decisions visible instead of letting them pass as vague agreement. Where an answer might be "I have not decided", give the menu an option that says so and send it to 13.
- Ask in free prose when the founder's own words are what the document needs: descriptions, stories, reasons, names. Never flatten those into a menu.
- Each document skill has an Asking section saying which of its questions are menu-shaped and which need prose. Follow it.
- Exercise judgment on order and depth within a document. The document skill says what must be answered and where founders go wrong, not what to say. Follow the conversation; skip what intake already answered; go deeper where the founder is vague on something that matters.
- Each document skill ends with a Feeds list: what the document hands to others. For 13 and 14, append directly. For a later document, add a one-line note to 13 tagged with that document's number and use it when that document comes up; do not write later documents early. For an earlier document, change the file and tell the founder.
- "I don't know" is a complete answer. Record it in 13 with why it matters and move on. Never push a founder into inventing an answer; a confident wrong answer costs more than a gap.
- Every call made on the founder's behalf ("we assumed web-first") is a row in 13 marked as an assumption, so Incubyte can tell decided from defaulted.
- Any domain term the founder uses that an engineer would not know is a row in 14, in the founder's own definition.
- The file is what the founder reviews. Do not paraphrase a finished document back in chat; point at the file and wait.
- Nothing invented. Every statement in the package traces to something the founder said or handed over.
- Plain language in every document. No emojis anywhere. Mermaid is the only diagram format inside markdown. Wireframes are grayscale HTML, layout only.

## Document skills

These are invoked in order by the loop above, not by the founder.

| Document | Skill |
|---|---|
| 01 Business Context | `mvp-spec:business-context` |
| 02 Product Overview | `mvp-spec:product-overview` |
| 03 Personas | `mvp-spec:personas` |
| 04 User Journeys | `mvp-spec:user-journeys` |
| 05 Scope | `mvp-spec:scope` |
| 06 Features and Acceptance Criteria | `mvp-spec:features` |
| 07 Data and Permissions | `mvp-spec:data-and-permissions` |
| 08 Platform, Integrations and Content | `mvp-spec:platform` |
| 09 Rules and Compliance | `mvp-spec:compliance` |
| 10 Design Direction | `mvp-spec:design-direction` |
| 11 Wireframes | `mvp-spec:wireframes` |
| 12 Success Measures | `mvp-spec:success-measures` |
| 00 Start Here, consistency pass, zip | `mvp-spec:package` |

## Changing an earlier document

When the founder wants to change a document already written, invoke that document's skill, change the file, and ask them to review it. Mention which later documents may be affected; the consistency pass at packaging catches anything that no longer agrees.

## Additional Resources

- **`references/schema.md`** - the package contract: folder layout, what each document holds, writing rules, packaging.
