---
description: Extract raw SDLC records, audit the run and say tersely what is missing and why, build the Portfolio Delivery Diagnostic deck from the records, then verify every number in it against the records before handing it over
argument-hint: "[--domain a,b,c,d] [--window 6m] [--scope full|curated] [--out <dir>] [--from <run-dir>] [--engagement <name>] [--on-degraded resume|proceed|stop]"
allowed-tools: ["Read", "Write", "Bash", "Glob", "Grep", "Task", "Skill", "AskUserQuestion"]
---

You are running the full diagnostic pipeline: **extract → audit → report → verify**. The deliverable is a verified deck under `<run>/report/`, and a terse account of what the data could and could not support.

## You are an orchestrator, and each phase has one owner

You extract nothing, compute nothing and verify nothing yourself. You parse arguments, hand each phase to its owner, gate on what comes back, and render the results to the user in the shapes `docs/report-contract.md` fixes.

| Phase | Owner | You spawn / run | You gate on |
|---|---|---|---|
| 1 Extract | `/sdlc-analysis:extract` | the extract command, via the Skill tool | it returned |
| 2 Audit | `scripts/validate-run/`, then `sdlc-analysis:run-auditor` | the validator (Bash), then one Task | the audit verdict |
| 3 Report | `sdlc-analysis:report-analyst` | one Task | a `written` block |
| 4 Verify | `scripts/verify-report/`, then `sdlc-analysis:report-verifier` | the verifier script (Bash), then one Task | the verification verdict |

Before Step 1, read `"${CLAUDE_PLUGIN_ROOT}/docs/report-contract.md"` — the report directory layout, the audit block and its terse rendering, the ledger, the verification block, the severity and verdict rules, and the fix loop. Cite it; do not restate it. If `CLAUDE_PLUGIN_ROOT` is not set, locate it relative to this command file at `../docs/report-contract.md`.

Two rules from the extraction side carry over whole: **you never open a `.jsonl`**, and **no record content ever reaches the terminal** — dataset ids, counts, completeness values, claim ids and reasons are all you print. The deck itself carries names; the terminal does not.

## Step 1: Parse arguments

Validate every argument here, before anything runs. An invalid argument stops the command with a one-line usage message.

| Argument | Default | Rules |
|---|---|---|
| `--domain`, `--window`, `--scope` | as the extract command defines them | Validated by the extract command's own Step 1; you only pass them through verbatim. Not allowed together with `--from`. |
| `--out <dir>` | `./sdlc-analysis-runs/<UTC-compact>/` | Resolve it **here**, with `date -u +%Y%m%dT%H%M%SZ`, and pass it to the extract command explicitly — every later phase needs to know the run directory, so it is never left to a default you did not see. Not allowed together with `--from`. |
| `--from <run-dir>` | none | Skip Phase 1 and start at Phase 2 on an existing run directory. The directory must exist and contain at least one `*.meta.json`; otherwise stop with the usage line. |
| `--engagement <name>` | unset | The client or portfolio name printed on the deck. When unset the analyst derives it from the run's scope identifiers and says so in `notes`. |
| `--on-degraded resume\|proceed\|stop` | unset | Pre-answers Phase 2's question when the audit verdict is `DEGRADED`. Any other token → stop with the usage line. `resume` on a run with nothing resumable behaves as `proceed`, and says so. |

Also resolve: **`run_dir`** (`--from`, else `--out`), **`report_dir`** = `<run_dir>/report`, and **`template`** = `"${CLAUDE_PLUGIN_ROOT}/templates/portfolio-delivery-diagnostic.html"`.

## Step 2: Phase 1 — Extract

Skip this step under `--from`.

Invoke the extract command through the Skill tool, passing the pass-through arguments plus the resolved `--out`, and **never `--verify`** (Phase 2 owns validation and would otherwise run it twice):

```
Skill({ skill: "sdlc-analysis:extract", args: "--out <run_dir> [--domain …] [--window …] [--scope …]" })
```

The extract command's own steps then run in this conversation exactly as written — its provider-map confirmation, its scope question, its output-directory guard, its parallel domain agents and its assembly. Let them. If the Skill tool is unavailable in this session, read `"${CLAUDE_PLUGIN_ROOT}/commands/extract.md"` and execute it in place with the same arguments; do not paraphrase it or skip a step.

When the extract command ends the run before writing anything (the user chose to stop at the provider map or refused the output-directory guard), you stop too, with one line saying which gate ended it.

## Step 3: Phase 2 — Audit

### 3a: Run the validator

```bash
mkdir -p "<report_dir>" && cd "${CLAUDE_PLUGIN_ROOT}/scripts/validate-run" \
  && { [ -d node_modules ] || npm ci --no-audit --no-fund; } \
  && node validate-run.mjs "<run_dir>" > "<report_dir>/validate-run.txt"; echo "exit=$?"
```

Capture stdout to `report/validate-run.txt` and note the exit code. If the validator cannot run (the directory is absent, `npm ci` failed — commonly offline —, or `node` is not on PATH), write the one-line reason to that file prefixed `not-run:` and continue; the auditor reads it and knows an unvalidated run is never `READY`.

### 3b: Spawn the auditor and wait

```
Task({
  subagent_type: "sdlc-analysis:run-auditor",
  prompt: "Audit the run and return only your marker block — the RUN_AUDIT block in the exact output format specified in your instructions.\n\nrun_dir: <run_dir>\nvalidator_output: <report_dir>/validate-run.txt"
})
```

Wait for it. Parse the text between `RUN_AUDIT_START` and `RUN_AUDIT_END`, strip the fence, and write the JSON verbatim to `<report_dir>/audit.json`. If no block comes back, say so plainly and stop: an unaudited run does not proceed to a report, and there is nothing yet to clean up.

### 3c: Render and gate

Print the block's `report` field **exactly as returned** — it is already the terse rendering the contract specifies; do not reformat, summarise or add to it. Then gate on `verdict`:

- **`BLOCKED`** → stop. After the report, print one line naming the fix: for validator errors, the dataset(s) to re-extract (`/sdlc-analysis:extract --resume <run_dir>` after removing the offending sidecar); for a run with no usable domain, the providers to connect. Nothing under `report/` beyond `audit.json` and `validate-run.txt` is written.
- **`DEGRADED`** → ask the user one question, unless `--on-degraded` pre-answered it. Offer exactly the options that apply:
  - **Resume extraction** — only when the block's `resumable` is `true`. Runs `Skill({ skill: "sdlc-analysis:extract", args: "--resume <run_dir>" })`, then repeats Step 3 from 3a. At most **three** resume rounds; after the third, the question is asked again without this option and says why.
  - **Proceed with lower bounds flagged** — every claim built on a truncated dataset will read as a floor, and every unavailable dataset as a named blind spot. Continue to Step 4.
  - **Stop** — end the run. The extraction and the audit stay on disk; print the resume command for later.
- **`READY`** → continue to Step 4 without asking.

## Step 4: Phase 3 — Report

Spawn the analyst and wait:

```
Task({
  subagent_type: "sdlc-analysis:report-analyst",
  prompt: "Build the report and return only your marker block — the REPORT_ANALYST block in the exact output format specified in your instructions.\n\nrun_dir: <run_dir>\nreport_dir: <report_dir>\ntemplate: <template>\naudit: <report_dir>/audit.json\nengagement: <name or unset>"
})
```

Parse the text between `REPORT_ANALYST_START` and `REPORT_ANALYST_END`. On `status: "failed"`, print its `reason` and stop — the audit and any partial files remain on disk. On `written`, print one line: the deck path, the claim count and the receipt count, as the block reports them. If no block comes back, treat it as `failed` with the reason "the report-analyst agent returned no marker block".

## Step 5: Phase 4 — Verify

### 5a: Run the mechanical verifier

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts/verify-report" \
  && { [ -d node_modules ] || npm ci --no-audit --no-fund; } \
  && node verify-report.mjs "<run_dir>" > "<report_dir>/verify-report.txt"; echo "exit=$?"
```

Capture stdout to `report/verify-report.txt`. If it cannot run, write `not-run: <reason>` to that file and continue; the verifier agent turns that into a `high` finding, which is the intended behaviour — a deck nobody could check mechanically does not pass.

### 5b: Spawn the verifier and wait

```
Task({
  subagent_type: "sdlc-analysis:report-verifier",
  prompt: "Verify the report and return only your marker block — the REPORT_VERIFY block in the exact output format specified in your instructions.\n\nrun_dir: <run_dir>\nreport_dir: <report_dir>\nmechanical: <report_dir>/verify-report.txt\nround: <1, 2 or 3>"
})
```

Parse the text between `REPORT_VERIFY_START` and `REPORT_VERIFY_END` and write the JSON verbatim to `<report_dir>/verification.json`. If no block comes back, the round is a `FAIL` with one `high` finding, "the report-verifier agent returned no marker block", and you write that block yourself.

### 5c: Gate, and the fix loop

- **`PASS`** → go to Step 6.
- **`FAIL`** and fewer than **two** fix rounds have run → spawn the analyst in fix mode and then repeat Step 5 from 5a with `round` incremented:

  ```
  Task({
    subagent_type: "sdlc-analysis:report-analyst",
    prompt: "Fix the report and return only your marker block.\n\nrun_dir: <run_dir>\nreport_dir: <report_dir>\ntemplate: <template>\naudit: <report_dir>/audit.json\nengagement: <name or unset>\nverification: <report_dir>/verification.json\nmechanical: <report_dir>/verify-report.txt"
  })
  ```

- **`FAIL`** after the second fix round → go to Step 6 and report the deck as **not verified**, with the open findings.

## Step 6: Report to the user

Terse, in this order, and nothing else:

1. **Deck** — the path to the deck file.
2. **Verdict** — `VERIFIED` or `NOT VERIFIED`, then in one line the counts from the verification block's `checked`: claims, receipts opened, unclaimed tokens adjudicated; and the round it was reached in.
3. **Floors and blind spots** — one line per entry in the audit's `missing[]`, reusing its `consequence` sentence verbatim, so the reader knows what the deck could not see. Omit the section when `missing[]` is empty.
4. **Open findings** — only when `NOT VERIFIED` or when `medium`/`low` findings travel with a `PASS`: one line per finding as `severity · location · problem`. Never omit a finding to keep this short.
5. **Next** — one line: `open <deck path>` when verified; the resume command or "re-run /sdlc-analysis:diagnose --from <run_dir>" when not.

No record content, no computed number, no restatement of the audit — the audit was already printed in full at Step 3c and lives in `report/audit.json`.
