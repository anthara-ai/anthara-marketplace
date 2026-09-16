# Output contract

The single source of truth for what a `sdlc-analysis` extraction run writes to disk. The orchestrator command and all four domain extractor agents read this file; nothing may restate a rule from here in its own words.

Machine counterparts, which must stay in step with this document:

- `schemas/dataset-file-schema.json` — `sdlc-analysis-dataset-v1`, the per-dataset sidecar envelope.
- `schemas/run-manifest-schema.json` — `sdlc-analysis-run-manifest-v1`, the run-level manifest.

## 1. What a run produces

```text
<out>/                                  default ./sdlc-analysis-runs/<UTC-compact>/
├── _run-manifest.json                  scope, window, providers resolved, per-dataset completeness
├── gaps.md                             every unavailable dataset/field + reason
├── a1-repositories.jsonl               one flat record per line (long format)
├── a1-repositories.meta.json           envelope/provenance sidecar
└── … one pair per dataset a1…d6
```

Every selected dataset produces **both** files, always — including a dataset whose provider was not connected. A dataset that could not be retrieved gets an empty `.jsonl` and a sidecar saying so. It never gets a missing file, and it never gets invented records.

This guarantee has two writers. The domain agent writes its own pairs, including the `unavailable` ones. When an agent dies before writing a dataset's files at all, the orchestrator materializes the missing `unavailable` pair at assembly, with an `unavailable_reason` naming the agent failure — a dead agent is a recorded reason, not a missing file. The one legitimate single-file state is a partial `.jsonl` with no sidecar: a dataset killed mid-extraction (see the write order in [§4](#4-the-sidecar-envelope)), which `--resume` re-runs. Nothing else may leave a dataset with fewer than both files.

The output directory holds real organisational data — author names and emails, ticket summaries, incident titles. Records are **not** redacted, because the plugin extracts raw records. The guard is placement, not content: the run directory must be git-ignored, and no record content is ever echoed to stdout.

## 2. Dataset id → filename map

24 datasets, four domains. The dataset id is lowercase in filenames (`a1`), uppercase when spoken about in prose (`A1`). The `Holds` column fixes each dataset's subject so the four domain catalogs cannot drift; the **requested fields and provider mappings live in `docs/datasets/<domain>.md`, never here**.

### Domain A — version control

| Dataset | Records file | Sidecar | Holds |
|---|---|---|---|
| A1 | `a1-repositories.jsonl` | `a1-repositories.meta.json` | Repositories in scope |
| A2 | `a2-commits.jsonl` | `a2-commits.meta.json` | Commits in the window |
| A3 | `a3-pull-requests.jsonl` | `a3-pull-requests.meta.json` | Pull requests in the window |
| A4 | `a4-review-events.jsonl` | `a4-review-events.meta.json` | Individual review events on those pull requests |
| A5 | `a5-review-comments.jsonl` | `a5-review-comments.meta.json` | Individual comments on those pull requests |
| A6 | `a6-branches.jsonl` | `a6-branches.meta.json` | Branches |
| A7 | `a7-tags-releases.jsonl` | `a7-tags-releases.meta.json` | Tags and releases |

### Domain B — CI/CD

| Dataset | Records file | Sidecar | Holds |
|---|---|---|---|
| B1 | `b1-pipeline-definitions.jsonl` | `b1-pipeline-definitions.meta.json` | Pipeline / workflow definitions |
| B2 | `b2-pipeline-runs.jsonl` | `b2-pipeline-runs.meta.json` | Pipeline / workflow runs in the window |
| B3 | `b3-jobs-steps.jsonl` | `b3-jobs-steps.meta.json` | Jobs and steps within those runs |
| B4 | `b4-deployments.jsonl` | `b4-deployments.meta.json` | Deployment status transitions, plus environment definitions and protection rules |
| B5 | `b5-reruns-approvals.jsonl` | `b5-reruns-approvals.meta.json` | Re-run attempts and approval / gate events |

### Domain C — tickets

| Dataset | Records file | Sidecar | Holds |
|---|---|---|---|
| C1 | `c1-projects-boards.jsonl` | `c1-projects-boards.meta.json` | Projects and boards, including board configuration where obtainable |
| C2 | `c2-issues.jsonl` | `c2-issues.meta.json` | Issues in the window |
| C3 | `c3-issue-changelog.jsonl` | `c3-issue-changelog.meta.json` | Individual field-change entries on those issues |
| C4 | `c4-sprints.jsonl` | `c4-sprints.meta.json` | Sprints / iterations |
| C5 | `c5-issue-comments.jsonl` | `c5-issue-comments.meta.json` | Issue comment counts and timestamps — never comment bodies |
| C6 | `c6-backlog.jsonl` | `c6-backlog.meta.json` | Backlog levels and their contents |

### Domain D — incidents

| Dataset | Records file | Sidecar | Holds |
|---|---|---|---|
| D1 | `d1-services.jsonl` | `d1-services.meta.json` | Services and escalation policies |
| D2 | `d2-incidents.jsonl` | `d2-incidents.meta.json` | Incidents in the window |
| D3 | `d3-incident-timeline.jsonl` | `d3-incident-timeline.meta.json` | Individual timeline events on those incidents |
| D4 | `d4-alerts.jsonl` | `d4-alerts.meta.json` | Alerts |
| D5 | `d5-oncall-shifts.jsonl` | `d5-oncall-shifts.meta.json` | On-call schedules and shifts |
| D6 | `d6-priorities.jsonl` | `d6-priorities.meta.json` | Priority / severity definitions |

Filenames are fixed. An agent that renames a file breaks `--resume`, the run manifest, and the validator at once.

## 3. The records file

### Why JSONL

A dataset's records live in `<id>-<name>.jsonl`: one JSON object per line, UTF-8, newline-terminated, no wrapping array.

The format is chosen for **appendability**. Extraction pages through a provider, and each page is appended the moment it arrives. A growing JSON array would have to be rewritten in full on every page, and a run killed mid-way — rate-limited, cancelled, out of context — would leave a file with no closing bracket that no consumer can parse. With JSONL, whatever landed is still valid and still readable, line by line. That property is what makes partial extraction useful instead of wasted.

### Long format: one row per observation

Every record is one **observation**, flat. Not one row per parent entity with children nested inside it.

A4 is the concrete case. A pull request reviewed by two people produces **two** records in `a4-review-events.jsonl`:

```jsonl
{"pull_request_id":"412","repository":"acme/checkout","reviewer":"dana@example.com","state":"approved","submitted_at":"2026-07-14T09:12:03+05:30"}
{"pull_request_id":"412","repository":"acme/checkout","reviewer":"kiran@example.com","state":"changes_requested","submitted_at":"2026-07-14T11:40:55+05:30"}
```

It does **not** produce one pull-request row with a `reviewers` array inside it. The same rule governs C3 (one record per field-change entry), B4 (one record per status transition), B5 (one record per re-run attempt and one per approval event), D3 (one record per timeline event) and D5 (one record per shift).

Each record carries the identifiers needed to relate it back to its parent — above, `pull_request_id` and `repository` — so a consumer can join. **The plugin does not do the join.** Joining is aggregation, and aggregation is out of scope.

### No derived fields — this prohibition binds the records

No record may contain a value the provider did not return:

- no computed durations (no `lead_time`, no `time_to_first_review`, no `cycle_time`)
- no counts as fields (no `review_count`, no `comment_count` on a parent record)
- no derived or reformatted timestamps
- no rollups, no averages, no percentiles, no scores, no ratings
- no cross-dataset joins

This is a property of the plugin, not of one run. Anything computed belongs to a downstream consumer.

The sidecar is a deliberate, named exception — see [§4](#4-the-sidecar-envelope).

### Timestamps pass through verbatim

A timestamp is copied byte-for-byte as the provider returned it, **with its original UTC offset intact**.

- `2026-07-14T09:12:03+05:30` stays `2026-07-14T09:12:03+05:30`.
- Do **not** normalise to `Z`. Do not convert to local time. Do not reformat, re-pad, or truncate sub-second precision.

> Normalising to `Z` (`2026-03-10T14:30:00Z`) is the common convention and it is **the wrong precedent here**. It would destroy the local-working-hours signal that is the whole reason for extracting a timestamp raw: `+05:30` at 09:12 and `-07:00` at 09:12 are different facts about when someone was working, and both collapse to the same instant under normalisation.

The same rule applies to `extracted_at` in the sidecar and to every timestamp inside a truncation record.

### Null means "the provider had no value here"

A field the provider returned as absent or empty is `null`. A field the provider **cannot supply at all** is omitted from the record entirely and recorded once in `gaps.md` — a per-record `null` is not how an unavailable field is reported. An empty string is an empty string, never a stand-in for either.

## 4. The sidecar envelope

Each dataset's provenance lives in `<id>-<name>.meta.json`, validated by `sdlc-analysis-dataset-v1`.

| Field | Required | Meaning |
|---|---|---|
| `dataset` | yes | The lowercase dataset id, one of the 24 |
| `records_file` | yes | The `.jsonl` filename this sidecar describes |
| `provider` | yes | `{ name, detected_via }`. `name` is `null` exactly when no provider was connected — and then `detected_via` is `null` too, because an unconnected provider was detected via nothing |
| `window` | yes | `{ requested, from, to }` — the requested window string and its resolved bounds, verbatim |
| `scope` | yes | `{ identifiers, note }` — provider-native repository / project / service identifiers extracted from; `[]` when unavailable |
| `completeness` | yes | `complete` \| `truncated` \| `unavailable` — closed enum, no fourth value, never absent |
| `record_count` | yes | Number of lines in the `.jsonl` |
| `truncation` | yes | Array of truncation records. `[]` when nothing was cut off |
| `extracted_at` | yes | When this dataset finished, verbatim |
| `unavailable_reason` | when `unavailable` | Why nothing could be retrieved |

**`record_count` is deliberate provenance, and it is not a violation of the no-derived-fields rule.** That rule binds the *records* (§3). The envelope's job is to describe the extraction, and `record_count` is the one field that makes silent truncation *detectable*: a consumer — or the validator — compares it against the actual line count of the `.jsonl` and against the truncation records, and a disagreement surfaces data loss that would otherwise look like success. Removing it would make the honesty guarantee unenforceable. Nothing else in the envelope is computed from the records.

### `completeness`, exactly three states

| Value | Means | Requires |
|---|---|---|
| `complete` | Pagination genuinely ran to exhaustion. Every record the provider holds for this window and scope is on disk | `truncation` is `[]` |
| `truncated` | Extraction started and stopped short | `truncation` has at least one record |
| `unavailable` | Nothing was retrieved — no provider connected, or the provider exposes no surface for this dataset | `record_count` is `0`, the `.jsonl` is empty, `unavailable_reason` is set, `truncation` is `[]`, and `gaps.md` has a line |

There is no fourth state, no absent value, and no `partial`, `unknown`, or `error`. A dataset that failed mid-way is `truncated` with a `provider_error` truncation record; a dataset that never started is `unavailable`.

`complete` is written **only** after the last page came back and the provider offered no continuation. It is never assumed from an empty final page, never assumed because a page returned fewer rows than requested, and never written because a cap looked like the end. When the provider offers no way to tell — a `top` parameter with no continuation token, and `returned == top` — that is not exhaustion; it is `truncated` with a `pagination_unsupported` record.

### Write order

The `.jsonl` is written and appended first; **the sidecar is written last**, after the dataset finishes. A run killed mid-dataset therefore leaves a partial `.jsonl` with no sidecar at all, which `--resume` reads as "not done". It must never leave a `complete` sidecar sitting over a partial records file.

## 5. The truncation record

A truncation record is the explicit marker written whenever extraction stops short of exhaustion. It is the plugin's only bound on volume — there is no cap, no sampling, no top-N, no dedupe — so it has to carry enough to continue.

```json
{
  "reason": "rate_limited",
  "detail": "Provider returned 429 after the second retry",
  "at": "2026-07-14T11:41:02+05:30",
  "last_record_id": "412",
  "last_record_timestamp": "2026-07-14T11:40:55+05:30",
  "remaining_estimate": 1840,
  "cursor": {
    "resumable": true,
    "resume_from": { "next_page_token": "eyJvIjo0MDB9", "page": 9 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `reason` | yes | Closed enum — see below |
| `detail` | yes | One sentence in the provider's own terms |
| `at` | yes | When the cutoff happened, verbatim |
| `last_record_id` | yes | Provider-native id of the last record written; `null` if none was |
| `last_record_timestamp` | yes | That record's timestamp, verbatim; `null` if none was |
| `remaining_estimate` | no | Records known to remain, when the provider reports a total; omit rather than guess |
| `cursor` | yes | How to continue — see resumability below |

`reason` is one of:

| `reason` | When |
|---|---|
| `rate_limited` | Provider throttled; one retry already happened |
| `provider_cap` | The provider caps what it will return and there is no paginated alternative |
| `pagination_unsupported` | The provider offers no skip / continuation, so the first page is all there is |
| `context_budget` | The extracting agent ran out of room to carry more records to disk |
| `provider_error` | Any other failure while paging |

### The cursor must be resumable

`cursor.resumable` is `true` and `cursor.resume_from` carries the provider-native parameters needed to replay the next page — token, page number, `skip`, `since` timestamp, last issue key, whatever that provider consumes. **A truncation record you cannot resume from is a contract defect.** `--resume` re-runs the datasets whose sidecar is absent or not `complete`, and it continues from `resume_from` rather than restarting — with one exception: a `truncated` dataset whose every truncation is legitimately `resumable: false` is skipped, because there is nothing to continue and a re-run would only reproduce the same records and the same cap.

`cursor.resumable` is `false` only when the provider genuinely exposes no continuation surface, and then `cursor.unreachable_reason` must say why. It is never a shortcut for "the cursor was not recorded". Two verified cases where it legitimately applies:

- **C3** — a Jira issue changelog is capped at its most recent entries and no paginated-changelog tool exists, so the older entries are unreachable via MCP at any page size.
- **A6** — the Azure DevOps branch list takes `top` but offers no skip or continuation, so there is no page two to ask for.

Both still record `last_record_id` and `last_record_timestamp`, and both still name the unreachable count in `detail` when the provider reported a total.

## 6. `gaps.md`

Exactly that filename, lowercase, at the run root. One document per run, grouped by domain, assembled by the orchestrator from the lines the four agents returned. It records **every** dataset and every requested field that could not be retrieved, with the reason — a gap is a record, never an omission.

```markdown
## Domain A — version control

- **A4 `submitted_at`** — unavailable on Azure DevOps: pull-request reviewers carry `vote` but no vote timestamp.
- **A6** — truncated on Azure DevOps: `repo_branch list` accepts `top` but exposes no skip or continuation.

## Domain D — incidents

- **D1–D6** — unavailable: no incident-management MCP server is connected.
```

Each line names the dataset (and the field, when the gap is field-level), the provider, and the reason in the provider's terms. Every `unavailable` sidecar and every truncation record has a corresponding line.

Lines record gaps and nothing else. An agent never returns a line asserting that a dataset has **no** gap — a clean dataset is silence, an empty gaps list is how a clean domain reads, and the only no-gaps sentence in the document is the domain-level sentinel the orchestrator itself writes at assembly (`commands/extract.md` Step 5d).

## 7. `_run-manifest.json`

Run-level provenance, written by the orchestrator at assembly, validated by `sdlc-analysis-run-manifest-v1`: the run id, its start (and finish), the window and scope, the scope selection, the invocation arguments, the provider resolved per domain, the output-directory guard result, and per-dataset `completeness` + `record_count`. `--resume` reads exactly this file to decide what to re-run.

### `scope_selection` — what the run covered on purpose, and what it left out

Every run records how its scope was decided. `{ "mode": "full" }` is a full sweep: every scope unit each resolved provider exposes, which is also how a manifest written before this field existed reads. Under `{ "mode": "curated" }`, one entry per enumerated domain records the enumeration state (`complete` / `truncated` / `failed`), whether the user kept everything (`"selection": "all"`) or curated (`"selection": "curated"`, with `selected` and `deselected` arrays of `{ id, name, last_activity }` units — each deselected unit additionally carrying its `reason`).

Two properties are the point of the object:

- **Exclusion is never silent.** A deselected unit appears in no dataset of the run, so this object is the only place it remains visible — with its name, its provider-native id, its last recorded activity as the provider's listing reported it, and why it was left out. A downstream report discloses a run's exclusions from here, with evidence, without re-querying any provider.
- **`last_activity` is passed through, never computed.** It is copied verbatim from the provider's listing response by the scope-scout agent; a unit whose listing carried no activity field simply lacks the key. The plugin labels nothing stale — the judgement belonged to the human who made the selection.

`--resume` carries a prior run's `scope_selection` forward verbatim and never re-asks: a run directory's scope is fixed when its manifest is first written, so its datasets can never disagree about what the run covers.

### `truncation_count` is a manifest field, derived — never a sidecar field

`datasets[].truncation_count` exists **only** in the manifest. It is the one entry in `datasets[]` that is not copied from the sidecar, because there is nothing to copy: the sidecar carries the `truncation` **array** and no count of it (see [§4](#4-the-sidecar-envelope) — `truncation_count` is absent from that table, and from `sdlc-analysis-dataset-v1`, deliberately).

It is derived as **the length of that sidecar's `truncation` array** — `truncation.length`, and `0` for an empty array. Nothing anywhere may describe it as copied from the sidecar.

The count is not added to the sidecar envelope, and must not be. `truncation.length` would then have two homes that can disagree, and a sidecar whose stored count contradicts its own array is a worse artifact than one that makes the reader count. The manifest earns the derivation because it serves a different reader: it is a run-level roll-up, letting someone see which datasets need `--resume` without opening 24 sidecars. Everything else in `datasets[]` — `completeness`, `record_count`, `records_file`, `meta_file` — is copied verbatim from the sidecar, which is the authority.

`datasets[]` covers every dataset the run has a sidecar for, which is **not** a fixed count. A `--resume` run legitimately lists only the datasets it re-ran plus whatever sidecars were already on disk from the earlier run.

## 8. Invariants a run must satisfy

Machine-checkable, and checked by `scripts/validate-run/`:

1. `completeness: "complete"` and a non-empty `truncation` array can never coexist.
2. `record_count` equals the actual line count of the `.jsonl`.
3. `completeness: "unavailable"` implies `record_count == 0`, an empty `.jsonl`, an `unavailable_reason`, an empty `truncation` array, and a `gaps.md` line. **A dataset that was never extracted cannot have been cut off**, so a truncation record under `unavailable` is as incoherent as one under `complete`, and is rejected the same way.
4. Every truncation record with `cursor.resumable: true` carries a non-empty `resume_from`; every one with `false` carries an `unreachable_reason`.
5. Every dataset present in the run directory has both files, and its sidecar validates against `sdlc-analysis-dataset-v1`.
6. Every `dataset` value is one of the 24 ids in [§2](#2-dataset-id--filename-map), and the `records_file` matches that id's filename.
7. `_run-manifest.json`, when present, agrees with the sidecars: every `datasets[]` entry's `completeness`, `record_count` and `records_file` equal its sidecar's verbatim, its `truncation_count` equals that sidecar's `truncation.length`, every sidecar on disk is listed, and no entry names a dataset with no sidecar. The manifest is what `--resume` reads, so manifest↔sidecar drift silently steers the next run — a manifest claiming `complete` over a `truncated` sidecar is exactly the false pass this invariant exists to reject.
