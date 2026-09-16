---
description: Extract raw SDLC records from whatever MCP servers are connected into one file per dataset, plus a gaps.md naming everything unobtainable and why
argument-hint: "[--domain a,b,c,d] [--window 6m] [--scope full|curated] [--out <dir>] [--resume <dir>] [--verify]"
allowed-tools: ["Read", "Write", "Bash", "Glob", "Grep", "Task"]
---

You are running a raw SDLC extraction across four domains — version control, CI/CD, tickets, incidents. The deliverable is a directory of files: one `.jsonl` + `.meta.json` pair per dataset, a `gaps.md`, and a `_run-manifest.json`.

## You are an orchestrator, not an extractor

**You MUST use the Task tool to spawn the domain extractor agents. Do NOT extract any dataset yourself — you are an orchestrator, not an extractor. Your job is to parse arguments, resolve providers, guard the output directory, spawn agents, wait for results, and assemble the manifest and `gaps.md`.**

This file contains, and must forever contain, **no extraction instruction of any kind**:

- no MCP data-fetch call — provider tools are *detected* in Step 2 and never invoked here;
- no pagination logic, no continuation tokens, no retry-on-rate-limit loop;
- no field mapping and **no per-dataset field list** — those live in each domain's own catalog under `docs/datasets/`, one dataset spec in exactly one place;
- no record content on stdout, ever. You handle dataset ids, counts, completeness values and reasons. Nothing else.

If you find yourself about to call a provider's tool, stop: that work belongs to a domain agent.

## Dataset bytes never travel through this command

Each domain agent writes its own dataset files directly to the output directory. What comes back to you is only a compact manifest — dataset id → `completeness` + `record_count` + filenames — and gaps lines, through the marker protocol.

**This is a deliberate divergence from the usual fan-out pattern, where each agent returns its full payload to the orchestrator and the orchestrator assembles it.** That pattern works when every payload is a compact JSON summary. It cannot work here: raw records *are* the deliverable, and tens of thousands of them across 24 datasets will not transit one context. Do not "restore consistency" with the usual pattern by routing records through this command — that change would break the plugin on the first repository with real history.

The corollary: you never read a `.jsonl`. You may read a `.meta.json` sidecar (provenance, not records) and the prior `_run-manifest.json`.

## The four domains

| Domain | Shortname | Agent (`subagent_type`) | Marker key | Catalog the agent reads | Datasets |
|---|---|---|---|---|---|
| Version control | `a` | `sdlc-analysis:version-control-extractor` | `VERSION_CONTROL` | `docs/datasets/a-version-control.md` | A1–A7 |
| CI/CD | `b` | `sdlc-analysis:cicd-extractor` | `CICD` | `docs/datasets/b-cicd.md` | B1–B5 |
| Tickets | `c` | `sdlc-analysis:tickets-extractor` | `TICKETS` | `docs/datasets/c-tickets.md` | C1–C6 |
| Incidents | `d` | `sdlc-analysis:incidents-extractor` | `INCIDENTS` | `docs/datasets/d-incidents.md` | D1–D6 |

Before Step 1, read `"${CLAUDE_PLUGIN_ROOT}/docs/output-contract.md"` — the single source of truth for the output layout, the dataset-id → filename map, the sidecar envelope, the `completeness` enum, the truncation-record shape, the `gaps.md` format and `_run-manifest.json`. Do not restate its rules in your own words anywhere; cite it. If `CLAUDE_PLUGIN_ROOT` is not set, locate it relative to this command file at `../docs/output-contract.md`.

## Execution

### Step 1: Parse Arguments

Validate every argument here, before anything else runs. An invalid argument stops the command with a one-line usage message — it is never guessed at, and it is never discovered halfway through a run that has already written files.

| Argument | Default | Rules |
|---|---|---|
| `--domain a,b,c,d` | all four | Comma-separated lowercase shortnames from `a`, `b`, `c`, `d`. Any other token → stop with the usage line. Duplicates collapse. This produces **the selected domain set**. |
| `--window 6m` | `6m` | `<N>d`, `<N>w`, `<N>m`, `<N>y`, or an explicit `<from>..<to>` of two ISO 8601 instants. Resolve it **once**, here, into `{ requested, from, to }` so all four agents share byte-identical bounds. Keep the offsets you resolved verbatim — no normalising to `Z` (see the contract's timestamp rule). |
| `--scope full\|curated` | unset | Pre-answers Step 2.5's question: `full` = sweep everything, `curated` = enumerate and pick, skipping straight to enumeration. Any other token → stop with the usage line. Unset → Step 2.5 asks. Passing `--scope` together with `--resume` is a conflict → stop with the usage line: a resumed run's scope was fixed when its manifest was first written, and re-scoping it mid-run would make the directory's own datasets disagree about what the run covers. |
| `--out <dir>` | `./sdlc-analysis-runs/<UTC-compact>/` | `<UTC-compact>` comes from `date -u +%Y%m%dT%H%M%SZ`. |
| `--resume <dir>` | none | The run directory to continue. Implies the output directory *is* that directory. Passing `--out` together with `--resume` is a conflict → stop with the usage line rather than picking one. |
| `--verify` | off | Boolean. Runs Step 6 after assembly. |

Also resolve, once:

- **`run_id`** — the basename of the output directory.
- **`plugin_version`** — the `version` from `"${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"`.
- **`scope`** — run `git remote get-url origin`. When it succeeds, that repository identifier is the scope hint you pass to the agents; when there is no remote, pass no hint and let each agent resolve and report the provider's own default scope. You do not enumerate repositories, projects or services yourself — that is a provider query, and provider queries belong to the agents.

> **The selected domain set is used in exactly three places, and all three must agree.** This is the single easiest defect to ship in this file, because each place reads correct on its own:
>
> 1. **Step 4's spawn list** — one Task call per selected domain, and none for an unselected one.
> 2. **Step 4's spawn-count phrasing** — "one per selected domain", never a hardcoded four.
> 3. **Step 5's assembly** — markers parsed, `domains[]` built, and `gaps.md` grouped for exactly the selected domains.
>
> Each of the three is labelled below. Change one and you must change all three.

### Step 2: Resolve providers

A **query step**: it decides which provider each selected domain will use, confirms that decision with the user, and writes nothing. No MCP server is required and none is hard-wired — whatever the user has connected drives the provider set.

For each domain in the selected domain set, fingerprint **two surfaces**, in this order, taking the first provider that matches:

| Domain | Providers it knows, in precedence order | MCP surface — tool names containing | CLI surface — `command -v` |
|---|---|---|---|
| `a` | `github`, `azure-devops` | `github`; `repo_`/`azure_devops`/`ado` | `gh`; `az` |
| `b` | `github-actions`, `azure-pipelines`, `jenkins` | `github` workflow/run tools; `pipelines_` | `gh`; `az`; `jenkins` |
| `c` | `jira`, `linear`, `azure-boards` | `jira`/`atlassian`; `linear`; `wit_`/`work_item` | `jira`; `linear`; `az` |
| `d` | `pagerduty`, `opsgenie` | `pagerduty`; `opsgenie` | `pd`. Opsgenie has no widely-used CLI, so it is MCP-only |

**Presence is the detection. Do not call a provider tool to test it** — a probe call is a data fetch, and this command performs none. For the CLI surface, `command -v <name>` is the whole test.

Each domain resolves to either `{ name, detected_via: "mcp" | "cli" }` or **unavailable** with a concrete reason — *"no version-control MCP tools and neither `gh` nor `az` on PATH"*. An unavailable domain is still spawned: its agent writes the `unavailable` sidecars, the empty `.jsonl` files and the gaps lines that the contract requires. Absence is a record, never an abort and never a missing file.

#### Confirm the provider map with the user

Fingerprinting is presence-based, so it can be wrong in both directions: an Azure DevOps server matches domains `a`, `b` and `c` at once, and a `gh` on PATH says nothing about whether the user meant this run to read GitHub. Show the resolution before acting on it — this is the last moment a wrong assignment costs nothing.

Print one line per selected domain: its purpose in plain words, then what resolved and through which surface —

```
a — version control     → github (mcp)
b — CI/CD               → azure-pipelines (mcp)
c — ticket management   → unavailable: no ticket MCP tools and neither `jira`, `linear` nor `az` on PATH
d — incident management → unavailable: no incident MCP tools and no `pd` on PATH
```

When any selected domain is unavailable, follow the map with a call to action naming every missing purpose and the providers that would fill it, so the user can fix the session now instead of discovering empty files later:

> No provider was detected for: **ticket management** (Jira, Linear, Azure Boards), **incident management** (PagerDuty, Opsgenie). Connect an MCP server for each — or install its CLI — and these domains will extract. If you proceed as-is, they will produce empty datasets and `gaps.md` entries.

Then **stop and ask the user**, and wait for one of three answers:

- **Proceed** — the mapping is right; carry it into Step 3, unavailable domains included. Absence stays a record, never an abort.
- **Correct** — they name a different provider for a domain (*"domain c should use azure-boards"*). Their word beats the fingerprint: set that domain's `{ name, detected_via }` to what they named, re-print the map, and confirm again.
- **Stop** — they want to connect servers first. End the run; nothing has been written yet, so there is nothing to clean up.

Do not skip this confirmation under `--resume` — a resumed run is exactly where a provider was likely connected since the last attempt, which is why Step 3's re-run set includes `unavailable` datasets.

### Step 2.5: Choose the run's scope — full sweep or curated

A **decision step**: it fixes which scope units each domain will extract — repositories for `a`, pipelines for `b`, boards / projects for `c`, services for `d`. Like Step 2 it writes nothing and calls no provider tool itself.

Resolve the mode first:

- **`--scope full`** → record `scope_selection: { "mode": "full" }` and continue to Step 3. Nothing differs from a run before this flag existed.
- **`--scope curated`** → skip the question; go straight to enumeration below.
- **`--resume`** → neither ask nor enumerate. Read `scope_selection` from `<out>/_run-manifest.json` and carry it verbatim — the run's scope was fixed when that manifest was first written, and Step 1 already rejected `--scope` alongside `--resume`. A prior manifest with no `scope_selection` key is a full-sweep run: treat it as `{ "mode": "full" }`.
- **Otherwise** → stop and ask the user, one question, two answers:
  - **Full sweep** (recommended) — every scope unit each resolved provider exposes. What this command has always done.
  - **Curated scope** — enumerate each domain's units with their last recorded activity, then pick what this run covers.

#### Curated: enumerate through the scope-scout, never yourself

Enumerating repositories, pipelines, boards or services is a provider query, and provider queries belong to agents. Spawn **one** Task call and wait for it:

```
Task({
  subagent_type: "sdlc-analysis:scope-scout",
  prompt: "Enumerate scope units for the domains below and return only your marker block — the SCOPE_SCOUT block in the exact output format specified in your instructions. Do NOT extract records and do NOT write files.\n\nwindow: { requested: \"<requested>\", from: \"<from>\", to: \"<to>\" }\nscope_hint: <repository identifier from Step 1, or none>\ndomains: [ { domain: \"a\", provider: { name: \"<resolved name>\", detected_via: \"<mcp|cli>\" } }, … ]   (every selected domain that resolved; unavailable domains are not enumerated)"
})
```

Parse the text between `SCOPE_SCOUT_START` and `SCOPE_SCOUT_END`, strip the fence, and read `{ domains: { "<shortname>": { enumeration, units: [ { id, name, last_activity } ], total, reason } } }`. If the scout returns no marker block, say so plainly and fall back to a full sweep — record `scope_selection: { "mode": "full" }` with a `note` naming the failure; a run is never aborted because enumeration failed.

Then present each enumerated domain in turn: a numbered list of its units — name, provider-native id, and `last_activity` exactly as the scout reported it, or *"not reported"* when the listing carried none. Ask for that domain: **`all`**, **`only <numbers or names>`**, or **`except <numbers or names>`**. Two constraints:

- When a domain's `enumeration` is `truncated`, offer only `all` and `only` — an `except` over a list the scout could not finish would deselect from units nobody has seen, and the leftover cannot be named in the manifest.
- When a domain's `enumeration` is `failed`, say so, name the reason, and treat the domain as `all`.

Unit names and last-activity timestamps are provenance metadata: they appear in this picker and in the manifest, and nowhere else. The no-record-content rule stands untouched — an enumeration contains no commit message, author identity, ticket summary or incident title, and none may appear here.

Record the outcome as the `scope_selection` object Step 5c writes into the manifest:

```json
{
  "mode": "curated",
  "domains": {
    "a": {
      "enumeration": "complete",
      "selection": "curated",
      "selected":   [ { "id": "…", "name": "…", "last_activity": "…" } ],
      "deselected": [ { "id": "…", "name": "…", "last_activity": "…", "reason": "user-deselected" } ]
    },
    "c": { "enumeration": "complete", "selection": "all" }
  }
}
```

`selection: "all"` (and every unavailable or failed domain) carries no `selected`/`deselected` arrays — that domain extracts at provider default scope exactly as a full sweep would. `last_activity` is copied verbatim from the scout: present when the provider's listing reported one, absent otherwise, never computed and never `null`. Every deselected unit is recorded **with its evidence** — exclusion is never silent, and this object is what lets a downstream report disclose what a run left out without re-querying any provider.

> **The curated selection is used in exactly three places, and all three must agree** — the same shape of defect as the selected-domain-set warning in Step 1: this step's `scope_selection` object, Step 4's per-domain `scope_units` payload line (exactly that domain's `selected` array, present only when its `selection` is `"curated"`), and Step 5c's manifest `scope_selection` (this object, echoed unchanged).

### Step 3: Guard the output directory

Records carry author names and email addresses, commit messages, ticket summaries and incident titles, and the plugin does **not** redact them — redaction would contradict "raw records only". The guard is therefore *placement*, and it runs before a single byte is written.

1. Create the directory: `mkdir -p "<out>"`.
2. Check it: `git check-ignore -q "<out>"`. Exit `0` = ignored. Exit `1` = **not** ignored. Exit `128` = not inside a git repository, which for this guard counts the same as not ignored, because git cannot protect the path either way.
3. **Ignored** → record `git_ignored: true`, `warned: false`, and continue silently.
4. **Not ignored** → warn loudly, in these terms, before anything is written:

   > This run will write **unredacted organisational data** to `<out>`, and that path is **not git-ignored**. The files will contain author names and email addresses, commit messages, pull-request and ticket summaries, and incident titles. Committing them would publish your organisation's people and work into version control.
   >
   > Fix it by adding `<out>` (or `sdlc-analysis-runs/`) to `.gitignore`, or by passing `--out` to a path outside the repository. Or confirm explicitly that you want to write here anyway.

   Then **stop and ask the user**. Do not create a file, do not spawn an agent, and do not proceed on an assumption. If the user does not explicitly confirm, end the run without writing anything and repeat the two fixes.

5. Record the outcome as the `output_guard` object Step 5 writes into the manifest: `path`, `git_ignored`, `warned`, and — required whenever `git_ignored` is `false` — `confirmed_by_user`. The manifest schema rejects a manifest that claims a non-ignored path without that confirmation, so this evidence is not optional bookkeeping.

#### When `--resume`, compute the datasets to re-run

Read `<out>/_run-manifest.json`. For each dataset of each selected domain, it is re-run when **either**:

- its `.meta.json` sidecar is absent from the directory, **or**
- that sidecar's `completeness` is not `complete` — **except** a `truncated` dataset whose every truncation record carries `cursor.resumable: false`. There is no continuation to replay for such a dataset; re-running it reproduces the same records and hits the same cap, so it is left exactly as it is (its `gaps.md` lines already record why). An `unavailable` dataset **is** re-run — a provider may have been connected since.

**And no others.** A dataset whose sidecar says `complete` is not re-run, not re-checked, and not touched — that is the entire point of the flag, because the tickets domain costs one provider call per issue and a full restart under a rate limit would never finish.

The sidecar on disk is the authority when it disagrees with the manifest, because the contract writes the sidecar last. Where a re-run dataset's sidecar carries a truncation record, pass that record's `cursor.resume_from` to the agent so it continues from the cutoff instead of restarting.

If `_run-manifest.json` is missing or unparseable, say so plainly and treat every dataset of every selected domain as needing a re-run. Do not abort.

Without `--resume`, the re-run set is every dataset of every selected domain.

### Step 4: Spawn domain extractors in parallel

**Spawn one Task call per domain in the selected domain set — all four only when `--domain` was absent, otherwise exactly the filtered subset and nothing more.** *(Selected domain set, edit 2 of 3 — the spawn-count phrasing.)*

**Spawn them ALL in a single message with multiple Task tool calls.** Do NOT spawn them one at a time; the four domains hit four different providers and nothing about them serializes. *(Selected domain set, edit 1 of 3 — the spawn list.)*

Use this call pattern per selected domain, with that domain's `subagent_type` from the table above:

```
Task({
  subagent_type: "sdlc-analysis:version-control-extractor",
  prompt: "Extract your domain's datasets and write them yourself. Return only your marker block — the manifest and gaps lines — in the exact output format specified in your instructions. Do NOT return records.\n\nout_dir: <out>\nwindow: { requested: \"<requested>\", from: \"<from>\", to: \"<to>\" }\nscope_hint: <repository identifier from Step 1, or none>\nprovider: { name: \"<resolved name>\", detected_via: \"<mcp|cli>\" }   (or unavailable, with the reason from Step 2)\nscope_units: [ { id: \"…\", name: \"…\" }, … ]   (ONLY when Step 2.5 recorded selection: \"curated\" for this domain — exactly its selected array. Omit the line entirely on a full sweep and for an all/failed/unavailable domain.)\nresume_datasets: [ { dataset: \"a3\", resume_from: { … } }, … ]   (the Step 3 re-run set for this domain; every dataset of this domain when not resuming)"
})
```

**How to wait for agents.** After spawning, you MUST wait for each agent to complete. Do NOT resume, poll, or call Task again with the same agent id. The Task tool notifies you when each completes. Only proceed to Step 5 after ALL spawned agents have returned.

While waiting and after, do not open any `.jsonl` the agents wrote. You have no reason to read a record and every reason not to.

### Step 5: Assemble

*(Selected domain set, edit 3 of 3 — parse, build and group for exactly the selected domains.)*

#### 5a: Parse each domain's marker block

For each spawned domain, in `a`, `b`, `c`, `d` order:

1. Find the text between that domain's `<MARKER>_START` and `<MARKER>_END` markers (`VERSION_CONTROL`, `CICD`, `TICKETS`, `INCIDENTS`).
2. Strip the JSON code fence.
3. Parse the JSON object. Its shape is `{ domain, provider: { name, detected_via }, datasets: [ { dataset, completeness, record_count, records_file, meta_file, truncation_count } ], gaps: [ "<gaps.md line>", … ] }`. The agent derives each `truncation_count` as the length of that dataset's sidecar `truncation` array; there is no `truncation_count` field on the sidecar itself.
4. Promote it to a top-level key on the run, under the domain's shortname.

`datasets[]` carries **exactly the datasets that agent processed this invocation** — every dataset of its domain on a normal run, exactly the `resume_datasets` subset under `--resume`. Its length is therefore not fixed, and a short `datasets[]` under `--resume` is correct rather than a defect. Do not pad it out to the domain's full range and do not synthesise the entries an agent did not report: Step 5b reconciles against the sidecars actually on disk, which is where a resumed run's already-`complete` datasets come from.

**If an agent did not run, failed, returned no data, or its markers are not found, set that domain to the fixed literal value:**

```json
{ "domain": "<shortname>", "status": "unavailable", "provider": { "name": null }, "datasets": [], "gaps": [] }
```

Then fill it in honestly: `reason` names what happened — *"the tickets-extractor agent returned no marker block"* — and you synthesise one `gaps.md` line covering that domain's whole dataset range with the same reason, e.g. `- **C1–C6** — unavailable: the tickets-extractor agent returned no marker block, so nothing was extracted for this domain.`

The domain is **never** a missing key in the manifest and the run is **never** aborted because one domain failed. And the contract's "both files, always" guarantee (§1) must still hold: for each of that domain's re-run datasets with **neither** file on disk, write the empty `.jsonl` and the `unavailable` sidecar yourself — the **complete** envelope with every schema-required field (`dataset`, `records_file`, `provider` as Step 2 resolved it, `window` from Step 1, `scope: { "identifiers": [] }`, `completeness: "unavailable"`, `record_count: 0`, `truncation: []`, `extracted_at`), never a subset, with `scope.note` omitted unless it is an actual sentence (a string or absence, never `null`), and `unavailable_reason` naming the agent failure (*"the cicd-extractor agent returned no marker block"*). These are the same pairs the agent would have written on its own unavailable path, written by the only process still standing to write them; materializing them is assembly, not extraction. A dataset with a partial `.jsonl` and no sidecar is left exactly as it is — that is the contract's killed-mid-dataset state, and `--resume` reads it as "not done". Step 5b then picks the sidecars you wrote off disk into `datasets[]`, so you still never fabricate a `datasets[]` entry whose files do not exist.

#### 5b: Reconcile against what is on disk

`Glob` `<out>/*.meta.json` and read the sidecars found. This costs nothing and it catches the two cases the markers cannot:

- **A sidecar exists that no agent reported** — either a dataset `--resume` deliberately left alone because it was already `complete`, or an agent that wrote datasets and then died mid-domain. Both look identical from here and both want the same treatment: include it in `datasets[]`, because its records are on disk and are worth recording. This is why the manifest can list a dataset no marker mentioned.
- **An agent reported a dataset whose sidecar is absent** — a mismatch. Record the dataset from the marker, and add a `gaps.md` line naming the missing sidecar, because the run cannot vouch for a dataset it cannot see.

Sidecar values win over marker values on any other disagreement; the sidecar was written by whoever wrote the records.

#### 5c: Write `_run-manifest.json`

Assemble it per the contract's `_run-manifest.json` section, against `"${CLAUDE_PLUGIN_ROOT}/schemas/run-manifest-schema.json"`:

- `run_id`, `started_at`, `completed_at` and `plugin_version` from Step 1 — timestamps verbatim, offsets intact.
- `invocation` — `domains` (the selected domain set), `window`, `out`, `resume`, `verify`, echoed as given.
- `window` — the `{ requested, from, to }` resolved once in Step 1.
- `scope` — the union of the `scope.identifiers` the sidecars report, with a `note` saying how scope was determined (the git remote, each provider's default scope, or the curated selection).
- `scope_selection` — exactly the object Step 2.5 recorded, echoed unchanged. Never recompute it from the sidecars, and never drop a `deselected` entry: the manifest is the only place a deliberately excluded unit is still visible, which is the point.
- `output_guard` — exactly the object recorded in Step 3. A `git_ignored: false` guard without `confirmed_by_user` fails validation, which is the intended behaviour.
- `domains[]` — one entry per selected domain, each `resolved` or `unavailable` with a `reason`.
- `datasets[]` — per-dataset `completeness`, `record_count`, `records_file` and `meta_file`, copied from the sidecars. Copy; do not recompute and do not adjust. `truncation_count` is the one exception: **the sidecar has no such field**, so derive it as the length of that sidecar's `truncation` array (`truncation.length`) — `0` for an empty array. It exists only here, as a roll-up so a reader sees which datasets need `--resume` without opening every sidecar — the contract's `_run-manifest.json` section fixes that.
- `gaps_file` — `gaps.md`.

#### 5d: Write `gaps.md`

One document at the run root, grouped by domain in `a`, `b`, `c`, `d` order, under the headings the contract fixes (`## Domain A — version control`, and so on) — only for selected domains.

Append each agent's gaps lines **verbatim, in the order returned**. Do not reword them, do not merge them, do not summarise them and do not "tidy" them into prose. The agents emit their lines from their own catalogs precisely so that `gaps.md` is reproducible run to run; rewriting them here destroys that property and makes a silent miss indistinguishable from a real absence.

The one returned line you do **not** append is a line asserting the absence of a gap ("no gap", "nothing to report"). The contract forbids agents from returning one — a clean dataset is silence — so such a line is agent noise, and appending it would plant a contradiction in a document that exists to record gaps. Drop it; the clean case is expressed only by the sentinel rule below.

A domain contributes a heading even when it has nothing to report. When every dataset in a selected domain is `complete` and it returned no gaps lines, write `- No gaps: every selected dataset in this domain extracted to exhaustion.` — and only then. If a domain returned no gaps lines but has a dataset that is `truncated` or `unavailable`, that is an inconsistency, not a clean run: record a line naming the dataset and that its reason was not reported.

#### 5e: Report to the user

Print the output directory, then one line per dataset: id, `completeness`, `record_count`. Then the count of gaps lines and the path to `gaps.md`.

**No record content, ever** — not a commit message, not an author name or email, not a ticket summary, not an incident title, not a sample line "for illustration". And no computed number: no totals, no rates, no averages, no durations. Counts and reasons as reported, nothing derived. The plugin computes nothing, and that includes its own terminal output.

### Step 6: Optional verify

Only when `--verify` was passed. Run the run validator over the output directory:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts/validate-run" \
  && { [ -d node_modules ] || npm ci --no-audit --no-fund; } \
  && node validate-run.mjs "<out>"
```

Findings arrive on stdout; diagnostics on stderr. Report the findings as given — the validator's judgement, not a re-interpretation of it. A non-zero exit means findings exist and is worth surfacing prominently; read the findings even then.

**If verification cannot run, say so plainly in one line naming which of these it was — the validator directory is absent, `npm ci` failed (commonly: offline), or `node` is not on PATH — and do not fail the run.** The extraction is the deliverable and it is already on disk. Verification is a check on it, not a precondition for it.
