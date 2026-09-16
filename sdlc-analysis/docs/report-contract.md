# Report contract

The single source of truth for what `/sdlc-analysis:diagnose` writes on top of an extraction run, and for how every number in a finished deck is traced back to records on disk. The diagnose command, the `run-auditor`, `report-analyst` and `report-verifier` agents, and `scripts/verify-report/` all read this file; nothing may restate a rule from here in its own words.

Machine counterpart, which must stay in step with this document:

- `schemas/evidence-ledger-schema.json` — `sdlc-analysis-evidence-ledger-v1`, the evidence ledger.

The extraction half of the plugin (`docs/output-contract.md`) computes nothing. This half computes, deliberately, and the whole contract below exists so that every computed value is **reproducible from the run directory by a process that is not the model that wrote the deck**.

## 1. What diagnose adds to a run directory

```text
<run>/                                   an extraction run, per output-contract.md
├── _run-manifest.json, gaps.md, *.jsonl, *.meta.json
└── report/
    ├── audit.json                       the run-auditor's verdict block, verbatim
    ├── analysis/
    │   ├── compute.mjs                  deterministic metrics script, plain Node, no dependencies
    │   └── metrics.json                 exactly what `node compute.mjs <run>` prints
    ├── evidence-ledger.json             one claim per number in the deck
    ├── portfolio-delivery-diagnostic.html   the filled deck
    ├── verify-report.txt                the mechanical verifier's findings, verbatim
    └── verification.json                the report-verifier's verdict block, verbatim
```

Everything under `report/` lives inside the run directory on purpose: the deck carries the same names, titles and identifiers the records do, so it inherits the run directory's placement guard (`output-contract.md` §1) and is never written anywhere that guard did not clear.

## 2. The phases and their gates

| Phase | Who | Reads | Writes | Gate to the next phase |
|---|---|---|---|---|
| 1 Extract | `/sdlc-analysis:extract`, unchanged | providers | the run directory | the extract command returned |
| 2 Audit | `scripts/validate-run/` then `run-auditor` | sidecars, manifest, `gaps.md`, validator output | `report/audit.json` | verdict `READY`, or `DEGRADED` with the user's go-ahead |
| 3 Report | `report-analyst` | records, sidecars, manifest, `gaps.md`, `audit.json`, the template | `analysis/`, the ledger, the deck | the analyst returned a `written` block |
| 4 Verify | `scripts/verify-report/` then `report-verifier` | everything under `report/`, the records | `verify-report.txt`, `verification.json` | verdict `PASS`; a `FAIL` sends findings back to phase 3, at most twice |

No phase reads a record it does not need: the auditor never opens a `.jsonl`; the analyst reads records only through `compute.mjs` and through targeted lookups for receipts; the verifier reads records only to confirm that ids and identities exist. No record content is ever printed to the terminal by any phase — dataset ids, counts, completeness values, claim ids and reasons are the only things that appear there.

## 3. The audit verdict

`run-auditor` returns one block, which the diagnose command writes verbatim to `report/audit.json` and renders to the terminal exactly as the block's `report` field says.

```json
{
  "verdict": "READY" | "DEGRADED" | "BLOCKED",
  "run_id": "…",
  "window": { "requested": "…", "from": "…", "to": "…" },
  "providers": { "a": "github (mcp)", "b": "azure-pipelines (mcp)", "c": "unavailable", "d": "unavailable" },
  "validator": { "ran": true, "errors": 0, "findings": [] },
  "datasets": [ { "dataset": "a3", "completeness": "truncated", "record_count": 1240, "truncation": [ … copied from the sidecar … ] } ],
  "missing": [
    {
      "dataset": "a3",
      "kind": "rate_limited" | "provider_cap" | "pagination_unsupported" | "context_budget" | "provider_error" | "unavailable" | "agent_failed",
      "on_disk": 1240,
      "cut_off_after": { "record_id": "812", "timestamp": "2026-05-02T14:11:09+05:30" },
      "remaining_estimate": 1840,
      "resumable": true,
      "detail": "Provider returned 429 after the second retry",
      "consequence": "every A3-derived number is a lower bound; pull requests created before 2026-05-02 are not on disk"
    }
  ],
  "resumable": true,
  "report": "<the terse terminal rendering, see below>"
}
```

Every value in `datasets[]` and `missing[]` is **copied** from a sidecar, a truncation record, the manifest or the validator's output — never recomputed. The two derived fields are `verdict` and `consequence`, and `consequence` is a sentence, not a number.

### Verdict rules

| Verdict | When | What happens |
|---|---|---|
| `BLOCKED` | the validator reported any error, **or** every selected domain is `unavailable`, **or** a sidecar is missing for a dataset the manifest lists | the run stops. A contract violation means the numbers cannot be trusted, and a report over no data is not a report |
| `DEGRADED` | no validator error, but at least one selected dataset is `truncated` or `unavailable` | the user chooses: resume extraction (when anything is resumable), proceed with lower bounds flagged, or stop |
| `READY` | no validator error and every selected dataset is `complete` | phase 3 starts without asking |

### The terse rendering

The `report` field is what the user reads, and it is built so the situation is understood at a glance:

```text
Run 20260915T101500Z · 2026-03-15 → 2026-09-15 · a github (mcp) · b azure-pipelines (mcp) · c jira (mcp) · d unavailable
Validator: no findings

  A version control   ■■□■■■■   6/7 complete    A3 rate-limited
  B CI/CD             ■■■■■     5/5 complete
  C tickets           ■■□■■■    5/6 complete    C3 provider cap, not resumable
  D incidents         ·······   0/6             no incident MCP connected

MISSING
  A3 pull requests     rate-limited by github · 1,240 on disk · cut off after PR 812 (2026-05-02) · ~1,840 remain · resumable
  C3 issue changelog   jira caps a changelog at its 100 most recent entries · 37 issues capped · not resumable
  D1–D6                no provider connected · nothing extracted

VERDICT DEGRADED · resume available: /sdlc-analysis:extract --resume <run>
```

Rules for the rendering: one line per selected domain, one line per missing entry, never a record's content (no titles, no names, no messages), and every number a copy of a sidecar or truncation field. `■` is `complete`, `□` is `truncated`, `·` is `unavailable`, in dataset order. A `READY` run renders the header, the domain lines and `VERDICT READY`, nothing else.

## 4. The evidence ledger

`report/evidence-ledger.json`, validated by `sdlc-analysis-evidence-ledger-v1`. One entry per number the deck shows.

```json
{
  "schema": "sdlc-analysis-evidence-ledger-v1",
  "run_id": "20260915T101500Z",
  "deck_file": "portfolio-delivery-diagnostic.html",
  "compute_script": "analysis/compute.mjs",
  "metrics_file": "analysis/metrics.json",
  "datasets_used": ["a3", "a4", "b2"],
  "lower_bound_datasets": ["a3"],
  "unavailable_datasets": ["d1", "d2", "d3", "d4", "d5", "d6"],
  "staleness_exclusions": [
    { "domain": "a", "unit": "acme/legacy-billing", "last_activity": "2025-11-02T08:14:00+00:00", "evidence": "a2, a3: no record in the trailing six months of the window", "disclosed_as": "acme/legacy-billing" }
  ],
  "claims": [
    {
      "id": "f1.first-review-wait.p50",
      "rendered": "4.2 days",
      "metric": "pull_requests.time_to_first_review_days.p50",
      "value": 4.2,
      "datasets": ["a3", "a4"],
      "population": 928,
      "method": "merged pull requests with at least one review event; hours from created_at to the earliest a4 submitted_at, as calendar days",
      "lower_bound": true,
      "receipts": ["acme/checkout#412", "acme/checkout#398"]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | Stable, lowercase, dot-separated. The same id appears on the deck element as `data-claim` |
| `rendered` | The exact text the deck shows for this claim, whitespace collapsed |
| `metric` | A dot path into `metrics.json`. Array indices are numeric segments (`buckets.2.share`) |
| `value` | What that path holds. The numeric token in `rendered`, commas removed, must equal `value` rounded to the token's decimal places; a string `value` must appear in `rendered` verbatim. A share the deck shows as a percent is therefore stored as a percent (`62.13`), never as a fraction |
| `datasets` | The dataset ids whose records the metric was computed from |
| `population` | The denominator or record count behind the value, when one exists |
| `method` | One sentence a skeptic could re-implement from |
| `lower_bound` | `true` exactly when any dataset in `datasets` is `truncated` in its sidecar. The deck text for such a claim says so ("at least", "of the records on disk", or an explicit floor note) |
| `receipts` | Optional. Provider-native ids the claim's exhibit cites. Each must occur verbatim in one of the claim's datasets' `.jsonl` files |

`lower_bound_datasets` is exactly the set of `truncated` sidecars whose dataset appears in any claim's `datasets`. `unavailable_datasets` is exactly the set of `unavailable` sidecars in the run. Both are copied from sidecars, and the verifier rejects a ledger that disagrees with disk.

### The `data-claim` attribute

Every deck element whose text is a number computed from records carries `data-claim="<claim id>"`. The element's text content, trimmed and whitespace-collapsed, equals the claim's `rendered`. A cell that shows two numbers is two elements with two claims. Numbers that are not claims — slide indices, dataset ids, the run id, dates copied from the manifest window — carry no attribute, and the verifier lists every such unclaimed token so the `report-verifier` can confirm each one is structural.

## 5. `compute.mjs` — the reproducibility rule

The analyst never types a number into the deck that it computed in its head or in its context. Every metric is produced by `report/analysis/compute.mjs`:

- plain Node 22, ES module, **imports `node:` built-ins only** — no `npm` packages, no relative imports;
- invoked as `node compute.mjs <run-dir>`; reads `.jsonl` and `.meta.json` files under that directory and nothing else;
- prints one JSON document to stdout with keys sorted, and nothing else; never writes a file;
- deterministic: no clock, no randomness, no environment reads. Running it twice yields byte-identical output;
- applies the template's staleness filter before aggregating, and emits the excluded units under a top-level `staleness_exclusions` key so the ledger's list can be checked against it;
- carries its own sanity assertions (shares in `[0, 1]`, populations that must sum, counts that cannot exceed a sidecar's `record_count`) and exits non-zero when one fails.

`metrics.json` is the captured stdout of that script. The mechanical verifier re-runs the script and rejects the report when the two differ.

Percentiles are nearest-rank over the sorted population. Durations are calendar time between two provider timestamps, offsets respected. A scope unit is stale when it shows zero activity in the trailing six months of the window (or the whole window, when the window is six months or shorter), tested only from records; the template's header comment is the authority for that rule and the script implements it, never loosens it.

## 6. Verification — mechanical, then judged

### `scripts/verify-report/verify-report.mjs`

Runs first, over `<run>/report/`, and its findings are the floor: any `[ERROR]` line fails the report regardless of what the agent concludes. It checks, in this order:

1. the ledger validates against `sdlc-analysis-evidence-ledger-v1` and names files that exist;
2. `compute.mjs` imports only `node:` built-ins, and re-running it reproduces `metrics.json` exactly. The import check gates the execution: a script reaching outside `node:` is reported and never run, because a run directory can arrive from anywhere;
3. every claim's `metric` path resolves in `metrics.json` and its `value` equals what is there;
4. every claim's `rendered` is a faithful rendering of `value` (§4);
5. every `data-claim` in the deck names a ledger claim and shows its `rendered` text; every ledger claim appears in the deck at least once (a claim the deck never shows is a warning);
6. `lower_bound_datasets`, `unavailable_datasets` and each claim's `lower_bound` agree with the sidecars on disk;
7. every receipt occurs in one of its claim's records files;
8. no `{{` survives, no em dash (U+2014) appears in deck text;
9. every truncated dataset in `lower_bound_datasets`, and every `unavailable` dataset, is named by its records filename or dataset id somewhere in the appendix text, and every `staleness_exclusions[].disclosed_as` appears there too;
10. every numeric token in the deck's visible text outside a `data-claim` element is listed as a warning with its surrounding words, for the agent to adjudicate.

Findings go to stdout, diagnostics to stderr; exit `0` when there is no error, `1` when there is, `2` on usage errors. Warnings alone exit `0`.

### `report-verifier`

Runs second, reads the script's output, and judges what a script cannot:

- each unclaimed numeric token is either structural (a slide index, a date from the window, a dataset id) or a missing claim — a missing claim is `high`;
- each claim's `method` matches what `compute.mjs` actually does for that metric;
- the prose around a claim does not overstate it (a `lower_bound` claim reads as a floor; a percentile is called a percentile; elapsed time is called calendar time);
- the template's honesty rules hold: percentiles over means, ranking disclosure present, gaps from `gaps.md` and every exclusion disclosed, every table card has a source and a caveat;
- a sample of receipts, opened in the records, actually show what the exhibit row says they show.

It returns one block, written verbatim to `report/verification.json`:

```json
{
  "verdict": "PASS" | "FAIL",
  "mechanical": { "errors": 0, "warnings": 14 },
  "findings": [
    { "severity": "high" | "medium" | "low", "location": "slide 04 · f1.first-review-wait.p50", "problem": "…", "fix": "…" }
  ],
  "checked": { "claims": 47, "receipts_opened": 12, "unclaimed_tokens_adjudicated": 14 }
}
```

`FAIL` when the script reported any error or the agent found any `high`. `PASS` otherwise; `medium` and `low` findings travel to the user with the pass. A `high` is anything that would make a number, an id, or a claim in the deck untrue or unsupported by the records, and any breach of a rule the template's header names.

### The fix loop

On `FAIL`, the diagnose command re-spawns `report-analyst` with the verification block and the script output, and the analyst fixes exactly the findings named — it does not re-analyse from scratch, and it does not touch claims no finding mentions. Phase 4 then runs again. At most two fix rounds; after that the command reports the remaining findings to the user as open, and never describes the deck as verified.
