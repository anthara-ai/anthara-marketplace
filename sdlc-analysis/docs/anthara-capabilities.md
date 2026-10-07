# Anthara workflow catalogue

The `report-analyst` reads this file to fill the OPTIONAL Anthara slide and sheet. It lists the Anthara workflows and skills that the deck can recommend. These are product facts, not facts from the client's records, and the deck labels them that way.

Update this file when Anthara ships a new workflow or skill.

## How to recommend

1. Recommend only what this catalogue lists. Do not invent a workflow, a trigger or an integration.
2. Map each finding to two to four entries. Pick the entries whose "Addresses" column matches the finding.
3. Mark each entry with one status:

   | Status | Use it when |
   |---|---|
   | Now | The entry is in the "Available" table, or the client's workflow configuration (`--anthara-config`) contains it |
   | Build | The entry is in the "Built on request" table |
   | Not in Anthara | The finding needs something this catalogue does not list. Name the client's own tool for it, and do not describe Anthara's roadmap |

4. Write what a workflow does, not what it cannot do. When a finding needs a hard gate, such as a required review before merge, recommend the client's branch protection or branch policy for the gate, and an Anthara workflow for the follow-up around it.
5. Never write that a workflow ran or did not run unless the client's records identify it.

## How workflows start

A workflow is a YAML file. It starts in one of these ways:

- on request, with inputs;
- on a schedule;
- when a pull request is opened or updated (GitHub or Azure DevOps);
- when a CI build fails;
- when someone mentions `@anthara` in a pull request comment.

A workflow can query the board (Jira or Azure Boards), comment on and label pull requests, push commits, open pull requests, update and link work items, and send a Microsoft Teams message or card that asks a question and waits for the answer.

## Available

| Workflow | Starts | What it does | Addresses |
|---|---|---|---|
| PR review | Pull request opened | Posts an AI review as comments | Slow or missing review |
| CI fixer | Failed build on a pull request (Azure DevOps) | Reproduces the failure and pushes a fix commit | Failed CI, red pull requests |
| Comment responder | `@anthara` mention | Answers in the thread or commits the requested change | Review rounds, slow follow-up |
| Spec writer | Schedule | Writes a spec pull request for stories marked ready | Unclear stories, rework |
| Small-item implementer | Schedule | Implements tagged small items and links the pull request | Backlog of small fixes |
| Story readiness | Schedule or on request | Scores stories and asks the author to clarify them | Work that starts unclear |
| Team digest | Schedule | Sends a Teams summary of work-item and pull request changes | Stale work nobody sees |

## Built on request

Each of these is a new workflow file on the current engine. No product change is needed.

| Workflow | Starts | What it does | Addresses |
|---|---|---|---|
| Reviewer rotation | Schedule | Assigns a reviewer to a pull request that has none, and reminds them | Review wait time |
| PR size guard | Pull request opened or updated | Labels a large pull request and suggests a split | Large batches |
| PR-to-ticket linker | Pull request opened | Finds the ticket key, asks the author when it is missing, and adds the link | Untraceable changes |
| Board sync | Schedule | Moves the linked ticket after its pull request merges | Board out of date |
| Failure digest | Schedule or failed build | Lists failing pipelines, or files a work item for one | Repeated CI failures |
| Stale backlog sweep | Schedule | Asks on a Teams card to keep, close or re-scope idle items | Aging backlog |
| CI fixer for GitHub | Failed GitHub Actions run | The CI fixer, for GitHub | Failed CI on GitHub |

## Skills in the editor (Available)

- `planner` and `plan-implementer`: plan and build work in small slices.
- `pr-walkthrough`: guides a human reviewer through a large pull request.
- `code-review`: a scored review posted as one comment (GitHub).
- `inbox` and `team-update`: show a lead the stale pull requests and items.
- `/sdlc-analysis:diagnose`: this diagnostic. Someone runs it on request, so describe a re-run as a manual step.
