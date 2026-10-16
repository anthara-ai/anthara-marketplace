# Anthara workflow catalogue

The `report-analyst` reads this file to fill the OPTIONAL Anthara slide and sheet. It lists the Anthara workflows and skills that the deck can recommend. These are product facts, not facts from the client's records, and the deck labels them that way.

Update this file when Anthara ships a new workflow or skill.

## How to recommend

1. Start from the finding's root cause, never from its symptom. Read the finding's entry in the ledger's `diagnoses[]` (`docs/root-cause-method.md`). A workflow is chosen for what it does to the root cause, not for the metric it would move.
2. Apply the method's test to every candidate: if the workflow worked perfectly, would the root cause stop, or would its effect be caught at the source before it becomes the symptom? A workflow that only makes the symptom metric look better fails.
3. Map each finding to two to four entries whose "Acts on" column matches the root cause. When no listed entry does, compose one (see "Composing a workflow"). When no workflow can act on the root cause, because it is a staffing, contract or priority decision, leave that finding off the slide and the sheet, and put the decision on the recommendations slide instead.
4. Name, in the lane and in the ledger remedy's `how`, the link of the cause chain the workflow breaks.
5. Write what a workflow does. Never write what Anthara cannot do, does not support or does not have. When a finding needs a hard gate, such as a required review before merge, recommend the client's branch protection or branch policy for the gate, and an Anthara workflow for the follow-up around it.
6. Never write that a workflow ran or did not run unless the client's records identify it.
7. Write each recommendation as a workflow the team can build on Anthara. The client does not need to run Anthara today. Give every entry the same "Build on Anthara" chip, and do not separate ready-made workflows from custom ones in the deck.

## How workflows start

A workflow is a YAML file. It starts in one of these ways:

- on request, with inputs;
- on a schedule;
- when a pull request is opened or updated (GitHub or Azure DevOps);
- when a CI build fails;
- when someone mentions `@anthara` in a pull request comment.

A workflow can query the board (Jira or Azure Boards), comment on and label pull requests, push commits, open pull requests, update and link work items, and send a Microsoft Teams message or card that asks a question and waits for the answer.

## Ready-made workflows

| Workflow | Starts | What it does | Acts on |
|---|---|---|---|
| PR review | Pull request opened | Posts an AI review as comments | No reviewer available when a change opens; defects that review would catch |
| CI fixer | Failed build on a pull request (Azure DevOps) | Reproduces the failure and pushes a fix commit | Breakages that sit unfixed and pull people off planned work |
| Comment responder | `@anthara` mention | Answers in the thread or commits the requested change | Review rounds that wait on the author |
| Spec writer | Schedule | Writes a spec pull request for stories marked ready | Work that starts unclear and is re-scoped mid-flight |
| Small-item implementer | Schedule | Implements tagged small items and links the pull request | Small items that compete with planned work for the same people |
| Story readiness | Schedule or on request | Scores stories and asks the author to clarify them | Work that starts unclear |
| Team digest | Schedule | Sends a Teams summary of work-item and pull request changes | Stuck work that nobody sees |

## Custom workflows

Each of these is a new workflow file on the current engine. No product change is needed.

| Workflow | Starts | What it does | Acts on |
|---|---|---|---|
| Reviewer rotation | Schedule | Assigns a reviewer to a pull request that has none, and reminds them | Review that depends on volunteers or on one person |
| PR size guard | Pull request opened or updated | Labels a large pull request and suggests a split | Changes too large to review or finish in one cycle |
| PR-to-ticket linker | Pull request opened | Finds the ticket key, asks the author when it is missing, and adds the link | Changes that cannot be traced to the work they serve |
| Board sync | Schedule | Moves the linked ticket after its pull request merges | A board that does not reflect finished work (a measurement cause, not a delivery one) |
| Failure digest | Schedule or failed build | Lists failing pipelines, or files a work item for one | Failures that recur because nobody owns them |
| Stale backlog sweep | Schedule | Asks on a Teams card to keep, close or re-scope idle items | Committed work that is no longer wanted but still counted |
| CI fixer for GitHub | Failed GitHub Actions run | The CI fixer, for GitHub | Breakages that sit unfixed, on GitHub |

## Composing a workflow

When the root cause needs a workflow no table lists, compose one from the triggers and actions in "How workflows start", and nothing else. Give it a plain name for what it does, list it as a custom workflow on the sheet, and say in one sentence how it breaks the cause. A composed workflow follows every rule above.

Two examples of the shape, not answers to reuse:

- **Defect interrupt fixer.** Root cause: urgent defects in a recent change pull people off planned work. On a schedule, query the board for new highest-priority defects, find the change that introduced each one, open a fix pull request, and send a Teams card to the owner. It catches the effect at the source (`mechanism`).
- **Dependency unblocker.** Root cause: items wait on another team with no one chasing the dependency. On a schedule, find items linked as blocked, and ask the blocking item's owner on a Teams card for a date. It acts on the wait (`mechanism`).

A schedule is the trigger for anything that starts on the board, because no board event starts a workflow.

## Skills in the editor

- `planner` and `plan-implementer`: plan and build work in small slices.
- `pr-walkthrough`: guides a human reviewer through a large pull request.
- `code-review`: a scored review posted as one comment (GitHub).
- `inbox` and `team-update`: show a lead the stale pull requests and items.
- `/sdlc-analysis:diagnose`: this diagnostic. Someone runs it on request, so describe a re-run as a manual step.
