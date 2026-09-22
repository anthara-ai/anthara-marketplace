# sdlc-analysis

A Claude Code plugin that pulls **raw** software-delivery records out of whatever MCP servers you have connected and writes them to disk — one file per dataset, plus a `gaps.md` naming everything it could not get and why.

It computes nothing. No metrics, no aggregation, no interpretation, no derived fields — that is a property of the plugin, not a setting you can flip. What lands on disk is what the provider returned.

## Why raw records

Every delivery-analytics tool you can buy gives you the answer. None of them gives you the evidence.

That is fine until someone asks a question the dashboard did not anticipate — *did review latency actually get worse, or did we just start opening PRs earlier?* — or until a number is going to be shown to a client and somebody has to be able to defend how it was computed. At that point a rolled-up metric is a dead end: you cannot re-derive it differently, you cannot see what it silently excluded, and you cannot tell the difference between "this was zero" and "this was never retrieved".

So this plugin does the unglamorous half, and does it honestly:

- **it extracts, it does not interpret** — the analysis layer is yours, and it gets to see every row the analysis was built from;
- **it distinguishes absence from zero** — a dataset nobody could retrieve is marked `unavailable` with a reason, never returned as an empty result that reads like a finding;
- **it never invents a record** — not a filled-in default, not an inferred field, not a plausible-looking gap;
- **it tells you where it stopped** — a partial dataset is marked `truncated` and carries a cursor, so the ceiling is visible in the output rather than hidden inside a number.

The point of the `gaps.md` file is that it can be trusted without re-checking. That is the whole design constraint.

## What it extracts

24 datasets across four domains:

| Domain | Datasets | What it pulls |
|--------|----------|---------------|
| **Version control** | A1–A7 | Repositories, commits, pull requests, review events, review comments, branches, tags and releases |
| **CI/CD** | B1–B5 | Pipeline definitions, runs, jobs and steps, deployments and environments, re-runs and approvals |
| **Tickets** | C1–C6 | Projects and boards, issues, issue changelog, sprints, comment counts and timestamps, backlog |
| **Incidents** | D1–D6 | Services, incidents, incident timeline, alerts, on-call shifts, priorities |

Per-dataset field lists live in [`docs/datasets/`](docs/datasets/) — one file per domain, one dataset spec in exactly one place.

Two things are deliberately **out** of scope rather than missing: comment bodies (A5 and C5 record counts and timestamps only, so no claim about review "substance" can be built on this data) and anything computed — durations, rates, or joins across datasets.

## No MCP server is required, and none is hard-wired

Each domain resolves a provider at run time from what is actually connected:

| Domain | Providers it knows | Detected via |
|---|---|---|
| Version control | GitHub, Azure DevOps | MCP tool names, or `gh` / `az` on `PATH` |
| CI/CD | GitHub Actions, Azure Pipelines, Jenkins | MCP tool names, or `gh` / `az` / `jenkins` on `PATH` |
| Tickets | Jira, Linear, Azure Boards | MCP tool names, or `jira` / `linear` / `az` on `PATH` |
| Incidents | PagerDuty, Opsgenie | MCP tool names (Opsgenie is MCP-only) |

Detection is presence-based — a tool's existence is the whole test, and no provider tool is ever called to probe it.

Because presence-based detection can be wrong in both directions (an Azure DevOps server matches three domains at once; a `gh` binary on `PATH` says nothing about whether you meant this run to read GitHub), **the resolved provider map is printed for confirmation before anything is written.** Every domain with no provider is called out by purpose — *ticket management (Jira, Linear, Azure Boards)* — so you can connect the missing server or correct a wrong assignment while it still costs nothing. You can also proceed as-is: a domain with nothing connected produces empty dataset files marked `unavailable` plus a `gaps.md` entry. It never aborts the run.

## Full sweep or curated scope

Once the provider map is confirmed, the run asks one more question: extract everything, or pick?

A **full sweep** — the default, and what every run before this option did — extracts every scope unit each provider exposes: every repository, every pipeline, every board, every service.

A **curated scope** enumerates first and extracts second. A dedicated [`scope-scout`](agents/scope-scout.md) agent lists each domain's units — repositories, pipeline definitions, boards / projects, services — with each unit's provider-native id and its last recorded activity exactly as the provider's own listing reports it. You then include or exclude per domain (`all`, `only …`, `except …`) before a single record is extracted. The scout makes listing-level calls only: no records, no files written, no computation. The plugin still labels nothing stale — the timestamps travel to you, and you judge.

The selection lands in `_run-manifest.json` as `scope_selection`, deselected units included with their evidence and a reason. A deselected unit appears in no dataset, so the manifest is the only place it stays visible — which is the point: no exclusion is ever silent, and a downstream report can disclose exactly what a run left out. If enumeration fails outright, the run falls back to a full sweep and says so in `scope_selection.note`; a single domain the scout could not list is extracted at provider default scope and marked `failed` with its reason. A run is never aborted because enumeration failed.

`--scope full|curated` pre-answers the question. `--resume` reuses the selection recorded in the manifest and never re-asks — a resumed run's scope was fixed when its manifest was first written, so `--scope` alongside `--resume` is rejected.

## Install

Add the Anthara marketplace once, then install the plugin:

```text
/plugin marketplace add anthara-ai/anthara-marketplace
/plugin install sdlc-analysis@anthara-marketplace
```

Start a new Claude Code session afterwards so the command and agents load. To check they did, type `/sdlc-analysis:extract` and it should offer to begin a run.

For local development, from a checkout of this repository:

```bash
claude --plugin-dir ./sdlc-analysis
```

Only the optional `--verify` step and the `diagnose` pipeline need anything beyond Claude Code itself: Node.js, for the run validator and the report verifier.

## Usage

Extract every domain over the default six-month window:

```
/sdlc-analysis:extract
```

Selected domains only:

```
/sdlc-analysis:extract --domain a,c
```

Domain shortnames: `a` version control, `b` CI/CD, `c` tickets, `d` incidents.

| Argument | Default | Meaning |
|---|---|---|
| `--domain a,b,c,d` | all four | Which domains to extract. |
| `--window 6m` | `6m` | `<N>d`, `<N>w`, `<N>m`, `<N>y`, or an explicit `<from>..<to>` of two ISO 8601 instants. Resolved once, so all four domains share byte-identical bounds. |
| `--scope full\|curated` | asks | `full` = sweep everything the providers expose; `curated` = enumerate scope units and pick before extracting. Unset → the run asks. Cannot be combined with `--resume`. |
| `--out <dir>` | `./sdlc-analysis-runs/<UTC-timestamp>/` | Where to write. |
| `--resume <dir>` | none | Continue a previous run — re-runs exactly the datasets that are not `complete`. |
| `--verify` | off | Run the output validator over the finished run. |

### From extraction to a verified deck

```
/sdlc-analysis:diagnose
```

Runs the whole pipeline: extract → audit → report → verify. It takes the extract command's `--domain`, `--window`, `--scope` and `--out` unchanged, plus:

| Argument | Default | Meaning |
|---|---|---|
| `--from <run-dir>` | none | Skip extraction and start the audit on an existing run directory. |
| `--engagement <name>` | derived from scope | The client or portfolio name printed on the deck. |
| `--on-degraded resume\|proceed\|stop` | asks | What to do when the audit finds truncated or unavailable data: resume extraction, proceed with every affected number flagged as a floor, or stop. |

See [How it works](#how-it-works) for what each phase does and where its gates are.

## Output

A run writes one directory:

```text
sdlc-analysis-runs/<UTC-timestamp>/
├── _run-manifest.json      scope, window, providers resolved, scope selection, per-dataset completeness
├── gaps.md                 every unavailable dataset/field + reason
├── a2-commits.jsonl        one flat record per line
├── a2-commits.meta.json    provenance sidecar
└── … one pair per dataset a1…d6
```

Every selected dataset produces **both** files, always — including one whose provider was not connected. A dataset that could not be retrieved gets an empty `.jsonl` and a sidecar saying so. It never gets a missing file.

Records are JSONL in **long format** — one row per observation. A pull request reviewed by two people yields two review-event records, not one row with a nested list, so the files load into a dataframe or a table without unnesting.

Timestamps pass through **byte-identical to what the provider returned, original UTC offset intact.** No normalising to `Z`: `09:12+05:30` and `09:12-07:00` are different facts about when someone was working, and normalisation collapses both onto the same instant — destroying exactly the signal that made the raw timestamp worth extracting.

Each sidecar records the provider, window, scope, record count, and a `completeness` of `complete`, `truncated`, or `unavailable`.

[`docs/output-contract.md`](docs/output-contract.md) is the full contract: the dataset-id → filename map for all 24 datasets, the sidecar envelope, the truncation-record shape, the `gaps.md` format, and the run manifest. It is the single source of truth that the orchestrator command and all four domain agents read.

## How it works

`/sdlc-analysis:extract` is an orchestrator and extracts nothing itself. It parses arguments, resolves providers, on a curated run sends the [`scope-scout`](agents/scope-scout.md) to enumerate scope units and asks you to pick, guards the output directory, spawns the four domain agents — [`version-control-extractor`](agents/version-control-extractor.md), [`cicd-extractor`](agents/cicd-extractor.md), [`tickets-extractor`](agents/tickets-extractor.md), [`incidents-extractor`](agents/incidents-extractor.md) — in parallel, and assembles the manifest and `gaps.md` from what they report.

**Each agent writes its own dataset files directly to disk.** What returns to the orchestrator is only a compact block of dataset ids, counts, completeness values and gaps lines. This is a deliberate divergence from the usual fan-out pattern where agents return payloads for the orchestrator to assemble: raw records *are* the deliverable here, and tens of thousands of them across 24 datasets will not transit one context. The orchestrator never reads a `.jsonl`.

### From extraction to a verified deck

`/sdlc-analysis:diagnose` is a second orchestrator layered on the first. It runs the extract command as its phase 1, then three more phases, each with one owner and one gate:

1. **Audit.** The run validator runs over the directory, then the [`run-auditor`](agents/run-auditor.md) reads the sidecars, the manifest, `gaps.md` and the validator's output and prints one terse block: a completeness glyph per dataset, a `MISSING` line per truncation or unavailable dataset naming what stopped it (rate limit, provider cap, no provider, dead agent), where the cut-off fell, how many records are estimated to remain, and whether `--resume` can recover them. The verdict is `READY`, `DEGRADED` (you choose: resume, proceed with floors flagged, or stop) or `BLOCKED` (a validator error or no usable domain — the run stops). The auditor never opens a records file.
2. **Report.** The [`report-analyst`](agents/report-analyst.md) fills [`templates/portfolio-delivery-diagnostic.html`](templates/portfolio-delivery-diagnostic.html). It never types a figure it computed in its head: every metric comes out of a deterministic, dependency-free `report/analysis/compute.mjs` it writes over the run's records, every number in the deck is wrapped in a `data-claim` element, and every claim is entered in `report/evidence-ledger.json` with its metric path, datasets, population, method sentence and the record ids it cites. Claims built on a truncated dataset are marked as lower bounds and read as floors in the deck; unavailable datasets and staleness exclusions are named on the method sheet. Before it writes any deck text it invokes [`incubyte-writing-voice`](skills/incubyte-writing-voice/SKILL.md), the same sentence-level rules the `mvp-spec` and `refactoring` plugins carry, so the client reads the deck in Incubyte's voice.
3. **Verify.** [`scripts/verify-report/`](scripts/verify-report/) re-runs `compute.mjs` and rejects the deck if the metrics do not reproduce, then checks every claim against the metrics, every `data-claim` against the ledger, every cited id against the records, every truncation and exclusion against the appendix, and lists every number shown outside a claim. The [`report-verifier`](agents/report-verifier.md) then adjudicates those numbers, reads each claim's method against the script, opens a sample of receipts in the records, and holds the deck to the template's honesty rules. Any mechanical error or `high` finding is a `FAIL`; the analyst fixes exactly the named findings and verification runs again, at most twice. A deck that still fails is handed over as **not verified**, with its open findings.

Everything the pipeline adds lands under `<run>/report/`, inside the run directory, so it inherits the same placement guard as the records. [`docs/report-contract.md`](docs/report-contract.md) is the full contract: the report layout, the audit block and its rendering, the ledger, the `compute.mjs` rules, and the verification checks and verdicts.

The extraction half still computes nothing. The diagnostic half computes, and the ledger plus the reproducibility check are what make every one of its numbers defensible in the room.

### Extraction is bounded by agent context, and the bound is visible

Records travel through the extracting agent's context before reaching disk. That is a real ceiling: **a very large dataset — tens of thousands of commits in the window, an issue changelog spanning years — will not extract completely in one pass.**

What the plugin guarantees is that this is never silent:

- pages are appended as they arrive, so whatever was retrieved is on disk and parseable even if the run is killed;
- a dataset that stopped short is marked `truncated`, never `complete`;
- every cutoff writes a truncation record naming the reason and carrying a cursor to continue from;
- `--resume <dir>` re-runs exactly the datasets that are not `complete`, continuing from that cursor — and does not touch one already marked `complete`, which matters because the tickets domain can cost one provider call per issue.

Rate limits behave the same way: one retry, then a truncation record, then on to the next dataset. A run always finishes, and always tells you what it did not get.

### Verifying a run

```bash
cd scripts/validate-run && npm ci && node validate-run.mjs <run-dir>
```

Or pass `--verify` to the command. The validator checks a run against the output contract: sidecar record counts against actual line counts, `completeness` against the presence of truncation records, the manifest against the sidecars on disk, and both against the JSON Schemas in [`schemas/`](schemas/). It exists to catch the one failure this plugin is built to prevent — a dataset claiming `complete` while carrying evidence that it is not.

## The output directory holds real organisational data

Records carry author names and emails, ticket summaries, and incident titles, and they are **not** redacted — redaction would contradict "raw records only".

The guard is placement instead:

- output defaults to `./sdlc-analysis-runs/<UTC-timestamp>/`, and `sdlc-analysis-runs/` is in this repo's `.gitignore`;
- before writing a byte, the command runs `git check-ignore` on the output path and **stops to warn you** when it is not ignored;
- no record content is ever printed to the terminal — not a commit message, not an author name, not a sample line "for illustration".

Treat a run directory as sensitive. Keep it git-ignored, or write outside the repository entirely.

## What this data can and cannot support

Carry these into any analysis built on a run. They are properties of the source systems, not of this plugin, and no amount of extraction fixes them:

- **Elapsed time from a changelog is calendar time, not effort.** Report it as "elapsed", never as engineer-days.
- **Deploy ↔ incident linkage is attributed by correlation**, not causation, unless your incident system carries explicit cause tags — which is rare. Temporal proximity is a hypothesis, not a finding.
- **There is no authoritative person → team roster**, and no identity mapping between a VCS handle, a ticket account and an on-call user. Team fields on A1/C1/D1 are configuration hints only, so team attribution and per-person views are not supportable from this data.
- **What a manual QA regression suite covers is invisible** to all four of these systems. Claims about gate effectiveness need a test-management source.
- **Nothing here measures trust, morale, cognitive load or psychological safety.** Perceptual data requires asking people.

## Repository layout

```text
commands/extract.md          the extraction orchestrator
commands/diagnose.md         the pipeline orchestrator: extract → audit → report → verify
agents/                      four domain extractors, the scope-scout, the run-auditor, the report-analyst, the report-verifier
docs/output-contract.md      single source of truth for the extraction output
docs/report-contract.md      single source of truth for the report, the evidence ledger and verification
docs/datasets/               per-domain dataset specs: requested fields, provider mappings
schemas/                     JSON Schemas for the sidecar, the run manifest and the evidence ledger
scripts/validate-run/        the run validator, its test suite and fixtures
scripts/verify-report/       the mechanical report verifier, its test suite and fixtures
templates/                   the Portfolio Delivery Diagnostic deck template
```

## Contributing

Adding a provider means extending the detection table in `commands/extract.md` Step 2 and the per-provider mapping rows in the relevant `docs/datasets/<domain>.md`. Adding or changing a dataset means editing `docs/output-contract.md` **and** widening the `dataset` enum in *both* files under `schemas/` in the same change — a partial widening fails at plugin load.

Run before opening a PR:

```bash
claude plugin validate .claude-plugin/plugin.json --strict
cd scripts/validate-run && npm ci && npm test
cd scripts/verify-report && npm ci && npm test
```

## License

Apache License 2.0. Copyright 2026 Anthara — see the marketplace [LICENSE](../LICENSE). Licensing inquiries: sapan@anthara.ai.
