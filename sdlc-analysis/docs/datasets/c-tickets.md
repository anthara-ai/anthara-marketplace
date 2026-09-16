# Domain C — tickets

The capability matrix for `agents/tickets-extractor.md`. One dataset spec lives here and nowhere else — the agent points at this file instead of restating field lists. Confidence markers: `[verified]` = confirmed against a live connected server's schema in this session. `[inferred]` = pattern-matched from the provider's documented API shape, not confirmed against a live server; the agent must not depend on an `[inferred]` tool name it has not actually seen connected, and must fall back to a gap when it is absent.

Providers known to this domain, in resolution precedence: **Jira**, **Linear**, **Azure Boards** (see `commands/extract.md` Step 2).

**Read this before the per-dataset tables — three provider-wide facts govern the whole domain.**

1. **Every Atlassian Rovo tool takes a `cloudId`, and none can be called without one** `[verified]`. It is resolved once in the agent's Phase 1; failure to resolve it is a boundary failure that stops the domain with that specific reason, not six datasets that each independently come back empty.
2. **`fields: ["*all"]` is required on the issue search** `[verified]`. The default field set silently omits custom fields, and both story points and sprint are custom fields — so a default-field request returns records that look complete and are not. The custom-field ids (`customfield_NNNNN`) are **site-specific**: resolve them from the field names in the payload actually received, never hardcode one `[verified]` that ids vary per site.
3. **The connected Linear MCP server is an unauthenticated stub** — it exposes only `authenticate` and `complete_authentication`, and no issue, project, cycle or comment surface of any kind `[verified]`. Nothing in this domain is retrievable from Linear today. The agent takes the unavailable path for all six datasets with that reason and does **not** call the authentication tools; this plugin never initiates a login. Every Linear cell below says this rather than implying support the server does not have.

---

## C1 — Projects & Boards

**Requested fields** — projects: key, name, type, lead, associated teams. Board configurations: columns, column-to-status mapping, WIP limits where set.

**Record shape** — long format, one record per project and one record per board column, `record_type` distinguishing them. A project is never a row with a nested board configuration:

```json
{"record_type":"project","project_key":"<key>","name":"<string>","project_type":"<string|null>","lead":"<string|null>","teams":[]}
{"record_type":"board_column","board_id":"<id>","board_name":"<string>","column_name":"<string>","mapped_statuses":["<status>"],"wip_limit":null}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | `getVisibleJiraProjects` with `cloudId`, paged by the tool's own paging params | project key, name, and whatever project-level attributes the tool returns for the calling account | **The board half of this dataset is unretrievable.** The connected Rovo server exposes **no board tool of any kind** `[verified]` — so board columns, the column-to-status mapping, and WIP limits cannot be fetched at all, at any page size, by any parameter combination. Emit no `board_column` records and log the board configuration as a dataset-half gap naming the missing tool. **Project lead** and **associated teams** are only present if `getVisibleJiraProjects` returns them for the calling account `[inferred]` — confirm from the payload received and omit + log rather than guess |
| Azure Boards `[verified]` for the gap | `wit_query` (WIQL) or the project-listing tool the connected server exposes, for the project half `[inferred]` | project name/id via whatever project surface is connected | **Same gap, different provider: there is no board column / WIP configuration surface on this provider either** `[verified]`. `work` `get_team_settings` and `list_team_iterations` exist, but they carry team and iteration settings, not a column-to-status mapping or a WIP limit. `get_team_settings`'s actual field list is `[inferred]` — inspect the schema before claiming any field from it |
| Linear | — | — | Nothing retrievable: the connected server is an unauthenticated stub (see provider-wide fact 3) `[verified]` |

---

## C2 — Issues

**Requested fields:** key, type (story / bug / task / epic / subtask), summary, reporter, assignee, priority, labels, components, story points, sprint(s), epic link, parent link, `created_at`, `resolved_at`, due date, resolution type. Scope: **all issue types, all statuses.**

**Record shape** (one record per issue):

```json
{"issue_key":"<key>","issue_type":"<string>","summary":"<string>","reporter":"<string|null>","assignee":"<string|null>","priority":"<string|null>","labels":[],"components":[],"story_points":null,"sprints":[{"id":"<id>","name":"<string>"}],"epic_link":"<key|null>","parent_key":"<key|null>","created_at":"<timestamp>","resolved_at":"<timestamp|null>","due_date":"<date|null>","resolution":"<string|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | `searchJiraIssuesUsingJql` with `cloudId`, `jql`, `fields: ["*all"]`, `maxResults` — **capped at 100 by the schema (`maximum: 100`)** — and `nextPageToken` cursor paging. The JQL carries the window and the scope; **all statuses and all types means the JQL must not filter on either**. Include `"comment"` in `fields` to get comments in `fields.comment.comments` for C5 | key, issue type, summary, reporter, assignee, priority, labels, components, created / resolutiondate / duedate, resolution, parent — plus story points and sprint **only** when `fields: ["*all"]` is passed | **`maxResults` cannot exceed 100**, so a large window is many cursor pages; that is a call cost, not a data gap, and paging continues to exhaustion. **Story-point and sprint custom-field ids are site-specific** — resolve from the returned field names, never hardcode `[verified]`. **Assignee history is not on the issue** — the requested "assignee (current + history)" splits: current here, changes in C3 within C3's cap. **Epic link** is itself a custom field on many sites `[inferred]` — locate it in the `*all` payload and omit + log when absent |
| Azure Boards `[verified]` that the tool exists | `wit_query` running WIQL for the issue set, then the work-item read tool for fields | work-item id, type, title, state, assigned-to, created / changed dates `[inferred]` | **Field coverage is `[inferred]` and must be confirmed against the `wit_work_item` and `wit_query` schemas before any field is claimed.** Azure Boards has no `story_points` field by that name (Scrum templates use *Story Points*, Agile uses *Effort*, CMMI uses *Size*) so the field name is process-template-dependent `[inferred]`; **components** have no Azure Boards equivalent at all (*Area Path* is the nearest, and it is not the same concept) `[inferred]`. Omit and log each field the schema does not confirm |
| Linear | — | — | Nothing retrievable: unauthenticated stub `[verified]` |

---

## C3 — Issue Changelog

> **The brief marks this dataset CRITICAL, and it cannot be fully retrieved via MCP.** Two independent hard ceilings, both `[verified]`, are recorded below. Neither is a field-level gap that a different parameter fixes.

**Requested fields:** every status transition — `from_status`, `to_status`, timestamp, actor — plus assignee changes, sprint changes, story-point changes and priority changes, all with timestamps.

**Record shape** — long format, one record per **field-change entry**. One history event that changed both status and assignee is **two** records; an issue with forty changes is forty records, never an issue row with a `changelog` array:

```json
{"issue_key":"<key>","changelog_id":"<id>","field":"status","from_value":"<raw id|null>","from_string":"<string|null>","to_value":"<raw id|null>","to_string":"<string|null>","changed_at":"<timestamp>","actor":"<string|null>"}
```

The same shape carries every requested change kind — `field` is `status`, `assignee`, `Sprint`, the site's story-points field name, or `priority`. There is no separate record type per field.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | `getJiraIssue` with `cloudId`, `issueIdOrKey`, `expand: "changelog"` — **one call per issue**, iterating the keys C2 collected. **Pass the smallest `fields` selection the tool's schema accepts** (e.g. `fields: ["created"]`): C2 already extracted the issue's fields, and the default full-issue payload (every field, author objects, avatar URLs) is what exhausts the extracting agent's context after a handful of issues — a 2026-08 run managed only 7 of 115 issues per invocation carrying full payloads. The changelog rides on `expand`, not on `fields` | per change entry: entry id, actor, timestamp, and per item the field name, `from`/`fromString`, `to`/`toString` — which covers status, assignee, sprint, story-point and priority transitions in one uniform shape | **Ceiling 1 — call amplification.** `searchJiraIssuesUsingJql` has **no `expand` parameter at all** `[verified]`, so the changelog cannot ride along with the search. C3 costs **one `getJiraIssue` call per issue**, making it the most rate-limit-exposed path in the whole plugin and the reason `--resume` is load-bearing rather than a convenience. **Ceiling 2 — the cap.** `getJiraIssue(expand: "changelog")` returns **at most the 100 most recent** changelog entries, and **there is no MCP tool for the paginated `/rest/api/3/issue/{key}/changelog` endpoint** `[verified]`. The complete history of any issue with more than 100 changes is therefore **not obtainable via MCP** at any page size |
| Azure Boards `[inferred]` | the work-item updates/revisions surface, if the connected server exposes one — **not confirmed present**; inspect the `wit_` tool list at runtime | field-change revisions with timestamps, if such a tool is connected `[inferred]` | Whether any changelog / revisions tool exists on this provider is **unconfirmed** — the agent resolves it from the session's tool list and records the whole dataset as `unavailable` with that reason when nothing is there. Claim no field from a tool you have not seen |
| Linear | — | — | Nothing retrievable: unauthenticated stub `[verified]` |

### Detecting the cap — compare the reported total against what arrived

**The agent must not use 100 as the trigger.** The documented figure is `[verified]`, but a constant in the agent is a constant that goes stale silently. The detection rule is a comparison against the provider's own number:

> Compare the response's `changelog.total` against the number of entries actually returned. **When `total` exceeds what you got, that issue is capped** — append a `provider_cap` truncation record naming the unreachable count (`total` minus what arrived) and the issue key it belongs to.

The boundary case that matters: an issue with **exactly 100** changes reports `total: 100` and returns 100 entries — equal, so **not** capped, and it must not be recorded as truncated. An issue with **101** reports `total: 101`, returns 100, and **is** capped by exactly one entry. Getting that boundary wrong in either direction is a defect: a false truncation record on the first, silent data loss on the second.

`cursor.resumable` is **`false`** on this truncation record. The contract permits `false` only where the provider genuinely exposes no continuation surface, and names this as one of exactly two such verified cases — there is no paginated-changelog tool to ask for page two, so `cursor.unreachable_reason` records that. The record still carries `last_record_id` and `last_record_timestamp` per the contract.

**C3 is never `complete` while any issue was capped**, however many other issues came back whole.

### Resuming a per-issue walk

Because C3 iterates issues one at a time, it appends each issue's records **the moment they arrive** — a rate-limited stop then leaves every already-retrieved issue's history on disk instead of discarding the dataset. Its `rate_limited` truncation record carries **the last issue key processed** in `cursor.resume_from`, so `--resume` continues from the next key. Given the per-issue cost, a full restart may never finish; this cursor is what makes the flag work.

---

## C4 — Sprints

**Requested fields:** sprint id, board, name, start date, end date, completed date; plus the issues committed at sprint start versus present at sprint end, and scope-change events where available.

**Record shape** — long format, one record per sprint; scope-change events are their own records within this dataset:

```json
{"record_type":"sprint","sprint_id":"<id>","board":"<string|null>","name":"<string>","start_date":"<timestamp|null>","end_date":"<timestamp|null>","completed_date":"<timestamp|null>"}
{"record_type":"scope_change","sprint_id":"<id>","issue_key":"<key>","change":"added","changed_at":"<timestamp>","actor":"<string|null>"}
```

Committed-at-start versus present-at-end is a **comparison of two states**. Even on a provider that exposed both, computing the difference would be a derived field — record the states the provider gives and leave the comparison to a consumer.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | none directly. Partial recovery only: sprint **names and ids** read off the issue-level Sprint custom field in C2's `fields: ["*all"]` payload | sprint id and name, for sprints that at least one in-window issue references | **The connected Rovo server exposes no sprint tool of any kind** `[verified]`, so **start date, end date and completed date cannot be retrieved**, and neither can the committed-at-start versus present-at-end scope. Write the sprint records with the date fields absent and log both gaps naming the missing tool. Whether the Sprint custom field's objects carry dates at all is site- and serialization-dependent `[inferred]` — read what the payload has, omit and log what it does not. **Sprints no in-window issue references are invisible** on this path — a real completeness limit worth naming, not a field gap. Sprint-change *events* are C3 records (within C3's cap), not C4 records: do not copy them across |
| Azure Boards `[verified]` | `work` `action: "list_iterations"` for the iteration set; `work` `action: "list_team_iterations"` for a team's subset | iteration name, `startDate`, `finishDate` — the best C4 coverage of any connected provider | **No completed date** — an Azure Boards iteration has a `finishDate` (scheduled) and no separate completion timestamp, so `completed_date` is unavailable `[inferred]`; confirm against the `work` schema before claiming otherwise. **Committed-at-start versus present-at-end is unavailable here too** — no iteration-snapshot surface exists `[inferred]`. Iteration names are not Jira sprint names; do not present them as the same field without saying which provider produced them |
| Linear | — | — | Nothing retrievable: unauthenticated stub `[verified]` |

---

## C5 — Comments & Links

> **Comment counts and timestamps only — never comment content.** The brief is explicit and it is also the right privacy default. **No record in this dataset may contain a comment body**, and no body may be logged, echoed, snippeted, summarised, or measured anywhere else either.

**Requested fields:** comment counts and timestamps per issue; issue links (blocks / is-blocked-by, relates-to, duplicates); links to pull requests and commits from the development panel where available.

**Record shape** — long format, three record types, `record_type` distinguishing them:

```json
{"record_type":"comment","issue_key":"<key>","comment_id":"<id>","author":"<string|null>","created_at":"<timestamp>","updated_at":"<timestamp|null>"}
{"record_type":"comment_total","issue_key":"<key>","comment_total":0}
{"record_type":"issue_link","issue_key":"<key>","link_type":"blocks","direction":"outward","related_issue_key":"<key>"}
```

`comment_total` is the **provider's own reported total** for that issue, copied verbatim as a requested raw field. It is **not** a number produced by counting the `comment` records written — that would be aggregation, which the contract forbids. When the provider reports no total, omit the field and log the gap; never substitute a self-computed count.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | `searchJiraIssuesUsingJql` with `"comment"` in `fields` — comments come back in `fields.comment.comments` `[verified]`, so no second pass per issue is needed | per comment: id, author, `created`, `updated`. The comment container's own reported total, when present in the payload | **Issue links** arrive in the `*all` payload's `issuelinks` field `[inferred]` — confirm from the payload received rather than from a dedicated tool, and log a gap when the field is absent. **Development-panel links (pull requests, commits) are not covered by any tool named in the verified Rovo surface** `[inferred]` — the agent confirms at runtime and logs a dataset-part gap when no development-information tool is connected. The comment **body** is present in the payload and is **deliberately not extracted** — that is a privacy rule, not a gap, and it does not get a `gaps.md` line |
| Azure Boards `[inferred]` | the work-item comments surface, if the connected server exposes one — not confirmed; inspect the `wit_` tool list at runtime | comment id, author, created date `[inferred]` | Whether a comments tool exists is **unconfirmed** on this provider. Work-item **links** (`Related`, `Blocks`, `Duplicate`) live in the work item's relations `[inferred]` — confirm against the `wit_work_item` schema. Azure Boards link type names differ from Jira's; copy the provider's own name verbatim rather than translating it into Jira's vocabulary |
| Linear | — | — | Nothing retrievable: unauthenticated stub `[verified]` |

---

## C6 — Backlog Snapshot

**Requested fields:** all unresolved issues, each with `created_at` and its last-updated timestamp.

**Record shape** (one record per unresolved issue):

```json
{"issue_key":"<key>","created_at":"<timestamp>","updated_at":"<timestamp>","status":"<string|null>","backlog_level":"<string|null>"}
```

This is a **snapshot of the present, not a window query.** The run's window does not bound it: an issue created before the window that is still open belongs in this snapshot. The sidecar's `scope.note` must say so, or a consumer will read the run's window as this dataset's bound.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Jira `[verified]` | `searchJiraIssuesUsingJql` with `cloudId`, an unresolved predicate in the `jql` (`resolution IS EMPTY`, or a not-done status-category predicate), `fields: ["*all"]`, `maxResults` ≤ 100, `nextPageToken` paging | issue key, `created`, `updated`, status | **No backlog-level concept exists on this path** — Jira's backlog is a board-relative view and there is no board tool `[verified]`, so `backlog_level` is unavailable on Jira and is logged as a field gap. Which unresolved predicate is correct is site-dependent (a site may resolve issues without setting a resolution) `[inferred]` — record in `scope.note` which predicate was used, so the snapshot's definition travels with the data |
| Azure Boards `[verified]` | `wit_backlog` `action: "list"` for the backlog levels, `action: "list_work_items"` for each level's contents | backlog level name, and the work items at that level — the only provider that supplies `backlog_level` | Item **field** coverage (`created_at`, `updated_at`, status) comes from the work-item read tool, not from `wit_backlog` itself `[inferred]` — confirm against the `wit_work_item` schema; `wit_backlog list_work_items` may return references rather than full items, which would mean a second call per item. Whether the backlog levels are inherently team-scoped (requiring a team identifier alongside the project) is `[inferred]` — confirm from the tool schema |
| Linear | — | — | Nothing retrievable: unauthenticated stub `[verified]` |
