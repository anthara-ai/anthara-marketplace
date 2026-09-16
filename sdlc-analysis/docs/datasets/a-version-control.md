# Domain A — version control

The capability matrix for `agents/version-control-extractor.md`. One dataset spec lives here and nowhere else — the agent points at this file instead of restating field lists. Confidence markers: `[verified]` = confirmed against a live connected server's schema in this session. `[inferred]` = pattern-matched from the provider's documented API shape, not confirmed against a live server; the agent must not depend on an `[inferred]` tool name it has not actually seen connected, and must fall back to a gap when it is absent.

Providers known to this domain, in resolution precedence: **GitHub**, **Azure DevOps** (see `commands/extract.md` Step 2).

---

## A1 — Repositories

**Requested fields:** name, default branch, created date, archived status, primary language, team/owner mapping.

**Record shape** (one record per repository):

```json
{"repository":"<name>","default_branch":"<string|null>","created_at":"<timestamp|null>","archived":true,"primary_language":"<string|null>","owner_team":"<string|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[inferred]` | `repo_repository` `action: "list"`, scoped to the project from `scope_hint` | name, default branch, project | **Created date** is not exposed by the repository-list surface. **Archived/disabled status** may appear as `isDisabled` — confirm before relying on it. **Primary language** is not exposed by Azure Repos (it has no language-detection API). **Owner/team mapping** does not exist at the repo level in Azure DevOps — teams are a project-level construct, not a per-repo field |
| GitHub `[inferred]` | `/repos/{owner}/{repo}` or the equivalent list tool | name, `default_branch`, `created_at`, `archived` (boolean), `language` (primary language) | **Owner/team mapping** requires a separate teams/permissions call not covered by the repository object itself — record as a field-level gap unless a teams tool is also confirmed connected |

---

## A2 — Commits

**Requested fields:** SHA, author, committer, authored timestamp, committed timestamp, message, files changed, additions, deletions, parent SHAs — for the default branch and release branches.

**Record shape** (one record per commit per branch traversed):

```json
{"repository":"<name>","branch":"<name>","sha":"<sha>","author":{"name":"<string|null>","email":"<string|null>"},"committer":{"name":"<string|null>","email":"<string|null>"},"authored_at":"<timestamp|null>","committed_at":"<timestamp|null>","message":"<string|null>","files_changed":null,"additions":null,"deletions":null,"parents":["<sha>"]}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[inferred]` | a `repo_commit` (or equivalently-named) `action: "list"` with `searchCriteria.itemVersion` set to the branch, `top`/`skip` paging | commit id, author/committer name+email+date, comment (message), parent ids | **Files changed / additions / deletions** likely require a per-commit `get` call with change counts — an unconfirmed extra call per commit; if that tool is not present in the connected surface, omit these three fields and log the gap rather than guess at a value |
| GitHub `[inferred]` | `/commits?sha=<branch>` for listing, `since`/`until` for the window | sha, `commit.author`, `commit.committer`, `commit.message`, `parents` | **Stats** (`additions`, `deletions`, changed-file count) require a separate `/commits/{sha}` call per commit — the same per-commit call-amplification gap as Azure DevOps |

**Fallback surface — the local clone** `[verified]`. When `scope_hint` names the repository the run is executing inside and neither the MCP nor the provider-CLI surface lists commits (a 2026-08 session found `repo_search_commits` returning `infoCode: 6` org-wide — code search not enabled — and no `repo_commit` list tool connected), `git log` on the local clone serves this dataset in full: SHA, author, committer, both timestamps, message and parents via `--format`, and `files_changed`/`additions`/`deletions` via `--numstat` — provider-returned values, not derived ones. Record `detected_via: "cli"`. Its bound is what is fetched locally: run `git fetch --all --quiet` first, and log a gap naming any release branch that exists on the remote but could not be traversed locally.

---

## A3 — Pull Requests

**Requested fields:** number, title, author, `created_at`, `merged_at`, `closed_at`, base branch, head branch, draft status, additions, deletions, changed_files, commit count, labels, linked issues. Scope: open, merged, and closed.

**Record shape** (one record per pull request):

```json
{"repository":"<name>","number":"<id>","title":"<string>","author":"<string|null>","created_at":"<timestamp>","merged_at":"<timestamp|null>","closed_at":"<timestamp|null>","base_branch":"<string|null>","head_branch":"<string|null>","draft":true,"additions":null,"deletions":null,"changed_files":null,"commit_count":null,"labels":[],"linked_issues":[]}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` | `repo_pull_request` `action: "list"` with `status: "All"`, `top`/`skip` paging, `targetRefName`, `created_by_user`. **No date filter exists on this action** — the 6-month window must be applied client-side while paging by creation date, newest first, stopping once a page's oldest PR falls outside the window. `action: "get"` adds `includeChangedFiles`, `includeLabels`, `includeWorkItemRefs` — call it per PR (or per page) to fill `additions`/`deletions`/`changed_files`/`labels`/`linked_issues` | number, title, author, created/merged/closed timestamps, base/head branch, draft status, plus everything `get`'s three `include*` flags add | The absent date filter itself is the gap worth naming in `gaps.md` when it forces a wider page scan than the window strictly needs — not a missing field, but a cost/behavior difference from a provider that does filter server-side |
| GitHub `[inferred]` | list-pulls tool/endpoint with `state: "all"`, `sort: "created"`, `direction: "desc"` | number, title, user (author), `created_at`, `merged_at`, `closed_at`, base/head ref, `draft` | **No server-side date filter either** (GitHub's pulls listing has no `since`) — same client-side windowing as Azure DevOps. `additions`/`deletions`/`changed_files`/`commit count` require the single-PR `get` (present on the list summary for some servers, absent on others — confirm before assuming). **Linked issues** require parsing PR body/timeline for issue references — not a structured field on the PR object; record as a gap when no linked-issues tool is confirmed |

---

## A4 — PR Reviews & Review Events

**Requested fields, per PR:** reviewer, review state (approved/changes_requested/commented), `submitted_at`, review comment count; plus review-request events (who was requested, when).

**Record shape** — long format, one record per review event, `event_type` distinguishing a review from a review-request:

```json
{"pull_request_id":"<id>","repository":"<name>","event_type":"review","reviewer":"<string>","state":"approved","submitted_at":"<timestamp|null>"}
{"pull_request_id":"<id>","repository":"<name>","event_type":"review_requested","reviewer":"<string>","requested_at":"<timestamp|null>","requested_by":"<string|null>"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` | `repo_pull_request` `action: "get"` — reviewers array on the PR object | reviewer identity, `vote` (maps to state: approved / rejected / waiting-for-author / etc.) | **Reviewers carry `vote` but no vote timestamp** — `submitted_at` is genuinely unavailable per review, not an oversight. Review-request timing is similarly limited to whatever the reviewers array itself exposes; no separate request-event timestamp is confirmed to exist |
| GitHub `[inferred]` | `/pulls/{number}/reviews` for reviews, `/pulls/{number}/requested_reviewers` or the timeline API for request events | reviewer (`user.login`), `state`, `submitted_at` on the reviews endpoint | **Review-request timestamps** are not on the requested-reviewers endpoint itself (it lists current requested reviewers only, no `requested_at`) — the timeline/events API would be needed to get a request timestamp; if that tool is not confirmed connected, omit `requested_at` and log the gap |

---

## A5 — PR Comments

**Requested fields:** PR number, author, `created_at`, comment type (issue comment vs review comment).

**Record shape** (one record per comment):

```json
{"pull_request_id":"<id>","repository":"<name>","author":"<string|null>","created_at":"<timestamp>","comment_type":"issue_comment"}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[inferred]` | PR comment threads — a `repo_pull_request_thread`-style `action: "list"` scoped to the PR, if such a tool exists on the connected surface | thread author, `publishedDate`, thread/comment type | Azure DevOps models comments as threads with nested comments rather than GitHub's issue/review-comment split — if no dedicated thread-listing tool is confirmed connected, this dataset is a **dataset-level gap** on Azure DevOps, not a field-level one |
| GitHub `[inferred]` | `/issues/{number}/comments` for issue comments, `/pulls/{number}/comments` for review comments | author (`user.login`), `created_at`, and the endpoint itself distinguishes `comment_type` | None beyond the standard per-comment call cost of hitting both endpoints per PR |

---

## A6 — Branches & Tags

**Requested fields:** branches — name, last commit date, ahead/behind default; tags/releases are A7, not this dataset.

**Record shape** (one record per branch):

```json
{"repository":"<name>","branch":"<name>","last_commit_at":"<timestamp|null>","ahead_by":null,"behind_by":null}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[verified]` | `repo_branch` `action: "list"` with `top` (default 100) | branch name, last-commit info | **No `skip` or continuation parameter exists** — pagination cannot proceed past `top`. Set `top` high and apply a saturation check: if `returned == top`, treat this as possible truncation and write a `pagination_unsupported` truncation record rather than claiming `complete`. **Ahead/behind may require a per-branch `get` call** `[inferred]` — not confirmed against the live server; confirm before relying on it, and when the per-branch call is not confirmed present, omit `ahead_by`/`behind_by` and log the gap instead of guessing |
| GitHub `[inferred]` | `/branches` with real `per_page`/`page` pagination | branch name, last-commit sha/date | **Ahead/behind vs. default** requires a per-branch `/compare/{base}...{head}` call — genuine call amplification (one call per branch); if not confirmed present, omit and log the gap |

---

## A7 — Tags & Releases

**Requested fields:** name, `created_at`, target SHA, release-notes flag.

**Record shape** (one record per tag or release):

```json
{"repository":"<name>","name":"<tag or release name>","created_at":"<timestamp|null>","target_sha":"<sha|null>","has_release_notes":null}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| Azure DevOps `[inferred]` | annotated-tag listing (tool name unconfirmed on the connected surface) | tag name, target commit | Azure Repos has **no GitHub-style Releases object** — there is no release-notes body or flag to report at all on this provider. Record `has_release_notes` as unavailable dataset-wide on Azure DevOps rather than a per-record gap |
| GitHub `[inferred]` | `/tags` for git tags, `/releases` for releases | tag name, release name, `created_at`, `target_commitish` (target SHA), `body` presence as the release-notes flag | None beyond the standard two-endpoint call cost (tags vs. releases are separate listings) |
