# Domain B — CI/CD

The capability matrix for `agents/cicd-extractor.md`. One dataset spec lives here and nowhere else — the agent points at this file instead of restating field lists. Confidence markers: `[verified]` = confirmed against a live connected server's schema in this session. `[inferred]` = pattern-matched from the provider's documented API shape, not confirmed against a live server; the agent must not depend on an `[inferred]` tool name it has not actually seen connected, and must fall back to a gap when it is absent.

Providers known to this domain, in resolution precedence: **GitHub Actions**, **Azure Pipelines**, **Jenkins** (see `commands/extract.md` Step 2).

---

## B1 — Workflow/Pipeline Definitions

**Requested fields:** name, trigger type (push / PR / schedule / manual), target branches, associated repo.

**Record shape** (one record per pipeline/workflow definition):

```json
{"repository":"<name>","pipeline":"<name>","definition_id":"<id|null>","trigger_type":"<string|null>","target_branches":["<string>"]}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` | `pipelines_definition` `action: "list"`, scoped to the project from `scope_hint` | definition id, name, folder path, repository | `action: "list"` was confirmed to serve this dataset; the full trigger configuration (trigger type, target branches) lives in the YAML/definition body and may require `action: "get"` per definition to resolve — `[inferred]`, mirroring A3's list-then-get shape. If a per-definition `get` action is not confirmed present on the connected surface, omit `trigger_type`/`target_branches` and log the gap rather than guess |
| GitHub Actions `[inferred]` | `/actions/workflows` (or the equivalent list tool) | workflow id, `name`, `path` (the file path implies trigger config, not a structured field) | **Trigger type and target branches are not structured fields on the workflow-list object** — GitHub exposes them only inside the workflow YAML file itself. Resolving them requires reading and parsing that file, which this agent does not do (parsing a YAML file to infer fields is interpretation, not extraction) — record as a gap unless a dedicated trigger-config tool is confirmed connected |
| Jenkins `[inferred]` | unconfirmed — no Jenkins MCP or CLI connected on this machine | none confirmed | Treat as unsupported until a Jenkins MCP server or CLI is actually detected in a session; do not guess at a tool name |

---

## B2 — Runs

**Requested fields:** run ID, workflow name, repo, branch, triggering event, triggering SHA/PR, actor, status, conclusion (success / failure / cancelled), `queued_at`, `started_at`, `completed_at`.

**Record shape** (one record per run):

```json
{"repository":"<name>","pipeline":"<name>","run_id":"<id>","branch":"<string|null>","triggering_event":"<string|null>","triggering_sha":"<sha|null>","triggering_pr":"<id|null>","actor":"<string|null>","status":"<string|null>","conclusion":"<string|null>","queued_at":"<timestamp|null>","started_at":"<timestamp|null>","completed_at":"<timestamp|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` | `pipelines_build` `action: "list"` with `minTime`/`maxTime` (a **real** server-side date filter, unlike PRs in domain A), `definitions`, `continuationToken` paging, `top`, plus `statusFilter`/`resultFilter`/`reasonFilter`/`branchName`/`requestedFor`/`repositoryId` | build id, definition name, repository, source branch, `reason` (maps to triggering event), `requestedFor` (actor), `status`, `result` (maps to conclusion), queue/start/finish times. `action: "get_status"` adds status, issues and report metadata `[verified]`; `action: "get_changes"` adds the commits and work items associated with a build, which is the closest confirmed path to a triggering SHA `[verified]` | **Triggering PR** is not directly exposed by `list` or `get_status` — recovering it depends on whether `get_changes`'s work-item/commit data surfaces a linked PR for this build; unconfirmed, so omit `triggering_pr` and log the gap when no such link is present in the response |
| GitHub Actions `[inferred]` | `/actions/runs` (or equivalent) with `branch`, `event`, `status` filters | run id, workflow name (`name`), `head_branch`, `event` (triggering event), `head_sha` (triggering SHA), `actor.login`, `status`, `conclusion` | **No discrete `queued_at`/`started_at`/`completed_at` fields exist on this provider** — GitHub's run object has `created_at` (proxy for queued), `run_started_at` (proxy for started), and `updated_at` (only a reliable completion proxy once the run has finished). Map field-by-field and log this naming mismatch as a gap rather than silently renaming GitHub's fields to the requested ones |
| Jenkins `[inferred]` | unconfirmed — no Jenkins MCP or CLI connected on this machine | none confirmed | Treat as unsupported until a server is connected |

---

## B3 — Jobs & Steps

**Requested fields, per run:** job name, status, `started_at`, `completed_at`, runner/agent, failed step name if applicable.

**Record shape** (one record per job within a run — the failed-step name is a field on the job record, not a nested per-step array):

```json
{"repository":"<name>","run_id":"<id>","job_name":"<string>","status":"<string|null>","started_at":"<timestamp|null>","completed_at":"<timestamp|null>","runner":"<string|null>","failed_step_name":"<string|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` — **UNAVAILABLE, dataset-level** | none — `pipelines_build` exposes only `action: "list"` / `action: "get_status"` / `action: "get_changes"` | none | **There is no timeline action on the connected surface.** Per-job/step timings, the runner/agent identity, and the failed-step name cannot be retrieved on Azure DevOps at all. This is a dataset-level gap, not a field-level one — write B3 as `unavailable` for this provider and log one `gaps.md` line naming the reason, rather than omitting individual fields from a partial record |
| GitHub Actions `[inferred]` | `/actions/runs/{id}/jobs` | job `name`, `status`, `started_at`, `completed_at`, `runner_name`, and a nested `steps` array whose entries carry `name`/`conclusion` — reading which step has `conclusion: "failure"` to populate `failed_step_name` is a field selection, not a computed value | None beyond the standard per-run call (one jobs call per run id) |
| Jenkins `[inferred]` | unconfirmed — no Jenkins MCP or CLI connected on this machine | none confirmed | Treat as unsupported until a server is connected |

---

## B4 — Deployments

**Requested fields:** deployment ID, environment (prod / staging / dev), repo, ref/SHA, creator, `created_at`, status transitions (pending → in_progress → success/failure) with timestamps; plus environment definitions and protection rules (required approvals).

**Record shape** — two record types, distinguished by `record_type`, never merged into one ambiguous row. Status transitions are long-format: **one record per transition**, each carrying its own timestamp — never a single wide deployment row and never a computed duration between states.

```json
{"record_type":"deployment_transition","deployment_id":"<id>","repository":"<name>","environment":"<string|null>","ref":"<sha|null>","creator":"<string|null>","created_at":"<timestamp|null>","state":"pending","state_at":"<timestamp>"}
{"record_type":"environment_definition","repository":"<name>","environment":"<string>","required_approvals":null,"protection_rules":[]}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps — tool existence `[verified]`, field coverage `[inferred]` | `pipelines_run` and/or a release-management surface exist on the connected server (confirmed by the planner's schema scan), but this authoring session had no live Azure DevOps tool access to inspect their action schemas | Not confirmed — deployments-and-environments in Azure DevOps traditionally live under classic Release pipelines or the newer YAML "Environments" (approvals & checks) surface, neither of which has a confirmed MCP tool mapping here | **Do not call `pipelines_run` or any release/environment tool name until it is actually seen connected in the live session.** If, at runtime, no such tool is present, write B4 as `unavailable` with that reason rather than guessing at field names |
| GitHub Actions `[inferred]` | `/deployments` for deployment records, `/deployments/{id}/statuses` for the transition history, environment protection-rules endpoint for required reviewers | deployment id, `environment`, `ref` (SHA), `creator.login`, `created_at`; each status entry's `state` and `created_at` (the transition's own timestamp); environment protection rules' required-reviewer list | **Status transitions require one `/deployments/{id}/statuses` call per deployment** — genuine call amplification, not a gap by itself, but log it if the connected surface does not expose a statuses tool. Protection-rule detail (wait timers, branch policies) beyond required approvals is a bonus field, not requested — do not invent fields beyond what the provider actually returns |
| Jenkins `[inferred]` | unconfirmed — no Jenkins MCP or CLI connected on this machine | none confirmed | Treat as unsupported until a server is connected |

---

## B5 — Artifacts & Retries

**Requested fields:** re-run events (which runs were retried, how many attempts); manual approval/gate events with approver and timestamp.

**Record shape** — two record types, distinguished by `record_type`: **one record per re-run attempt**, and **one record per approval/gate event**.

```json
{"record_type":"rerun_attempt","repository":"<name>","run_id":"<id>","attempt_number":null,"triggered_by":"<string|null>","triggered_at":"<timestamp|null>"}
{"record_type":"approval_event","repository":"<name>","environment":"<string|null>","deployment_id":"<id|null>","approver":"<string|null>","decision":"<string|null>","decided_at":"<timestamp|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps — tool existence `[verified]`, field coverage `[inferred]` | `pipelines_artifact` and `pipelines_run` exist on the connected server (confirmed by the planner's schema scan), but this authoring session had no live Azure DevOps tool access to inspect their action schemas for re-run or approval actions | Not confirmed | **Do not call either tool name until it is actually seen connected in the live session, and confirm which actions each exposes (list vs. rerun vs. approve) before relying on them.** If no confirmed rerun or approval action exists on the connected surface, write B5 as `unavailable` with that reason rather than guessing |
| GitHub Actions `[inferred]` | a re-run tool/endpoint (`/actions/runs/{id}/rerun` family) surfaces retry events; environment protection-rule approval/rejection is exposed via the deployment-review endpoints | attempt count is derivable from `run_attempt` on the run object itself (a field the provider returns, not a computed count); approver identity and decision timestamp from the deployment-review data | **Attempt count as a field vs. re-run event as a record** — this catalog reports one record per re-run **attempt** (an observation), reading the provider's own `run_attempt` field rather than computing a count. If no re-run history tool is confirmed connected, log the gap rather than inferring attempts from `run_attempt` alone |
| Jenkins `[inferred]` | unconfirmed — no Jenkins MCP or CLI connected on this machine | none confirmed | Treat as unsupported until a server is connected |
