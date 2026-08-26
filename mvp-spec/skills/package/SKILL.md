---
name: package
description: This skill should be used when every document 01 to 12 in an mvp-spec folder has been written and reviewed, or when the founder asks to "package the spec", "zip it up", "send it to Incubyte", "run the consistency check", or "finish the spec". Runs the cross-document consistency pass, writes "00 - Start Here.md" and produces the zip.
---

# Package

Final step of the `mvp-spec` interview. The interview rules and package contract live in the `mvp-spec` skill; if this step was entered directly rather than from that skill, read `${CLAUDE_PLUGIN_ROOT}/skills/mvp-spec/SKILL.md` first. The consistency pairs and zip naming are in `${CLAUDE_PLUGIN_ROOT}/skills/mvp-spec/references/schema.md`.

## Goal

Turn the folder of reviewed documents into the deliverable Incubyte receives: internally consistent, oriented by `00 - Start Here.md`, zipped with `intake/` and the open questions included.

## Consistency pass

Read every document and check the pairs the schema names:

- Every persona in 03 has a journey in 04, and no journey belongs to a persona 03 does not list.
- Every Must in 05 has acceptance criteria in 06, and 06 contains nothing that is not a Must.
- Every user-facing Must has a screen in 11, and every screen traces to a journey step and a feature.
- Every sensitive field flagged in 07 has a flag in 09.
- Every noun a feature in 06 touches is tracked in 07.
- Every document 01 to 12 exists.

Also look for what the pairs do not catch: a term used in two documents with two meanings, a handoff whose two sides disagree on mechanism, a content item in 08 nobody owns.

A failure is a finding, not a fix to make quietly. Tell the founder what disagrees with what, change the owning document with them through its skill, ask them to review the changed file, then run the pass again. Only when it is clean, continue.

## Write 00 - Start Here

Orientation for an Incubyte engineer opening the folder cold:

- The product one-liner from 02.
- How to read the package: the numbered order is the reading order; 13 is the kickoff agenda; wireframes are deliberately lo-fi.
- The list of documents, and the note that the founder reviewed each one before the next was written.
- The date of the consistency pass and that it was clean.
- The list of files in `intake/` and what each is.

## Zip

From the parent of the spec folder, create `<product-slug>-spec-<YYYY-MM-DD>.zip` containing the whole folder: every document, every wireframe, `intake/`, 13 and 14. Verify the archive lists the expected files.

## Before finishing

The consistency pass is clean and recorded in 00, and the zip exists with the expected contents.

## Then

Tell the founder where the zip is and that it is what goes to Incubyte. The interview is complete. If a document changes later, run this step again.
