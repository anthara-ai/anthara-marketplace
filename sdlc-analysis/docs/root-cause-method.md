# Root-cause method

The `report-analyst` follows this method for every finding before it writes a recommendation or picks a workflow. The `report-verifier` holds the deck to it. The ledger's `diagnoses[]` section (`docs/report-contract.md` §4) records each step, so the reasoning can be checked the same way the numbers are.

## Why this exists

A metric that looks bad is a symptom. A recommendation aimed at the symptom makes the metric look better and leaves the cause in place. If items spill out of every sprint, "move items faster" is a symptom fix. The useful question is what keeps the items from finishing, and the records can often answer it.

So the deck never goes from a symptom straight to a remedy. It goes from symptom to mechanism to root cause, each step tested against the records, and the remedy acts on the root cause.

## The method

### 1. State the symptom as a measurement

One sentence, built on claims: what is wrong, where, and by how much. "A share of committed sprint items finish in a later sprint" is a symptom. "The team is slow" is not, because it names no measurement.

### 2. Locate it before explaining it

Before asking why, ask where. Split the symptom population along every axis the records carry, and compute the split in `compute.mjs`:

- scope unit: repository, board, pipeline, service;
- work type: issue type, label, component, priority;
- origin: planned at the start of the cycle, or added after it started;
- time: week, sprint, release, and before or after a change in the records;
- people: author, assignee or reviewer, aggregated and never ranked (see the template's fairness rule).

A symptom concentrated in one slice points to a cause in that slice. A symptom spread evenly points to something systemic, such as a gate, a policy or a capacity limit. Either result narrows the hypotheses.

### 3. Write competing hypotheses, at least three

Write three or more causes that could each produce the same symptom, drawn from different families. These families are a checklist, not a list of answers:

| Family | The cause is… | Records that can test it |
|---|---|---|
| Demand | work arrives that the plan did not hold: interrupts, urgent defects, scope added mid-cycle | items created or added after the cycle started, their type and priority, and whether they finished while planned items did not |
| Quality and rework | work comes back: defects from recent changes, reopened items, reverts, failed builds | reopen transitions, bug-to-change links, revert commits, failure share, time from merge to the next defect |
| Wait | work sits in a queue: review, QA, approval, a blocked dependency | time in each status, time to first review, blocked flags and links |
| Size | items are too large to finish inside one cycle | estimate or diff size, against whether the item finished |
| Capacity | too much in progress for too few people, or knowledge held by one person | work in progress per person, concentration of approvals or assignments |
| Definition | work starts unclear and is re-scoped while in progress | description edits, scope changes and comment rounds after work started |
| Gate and flow | a fixed gate forces batching: release trains, manual sign-off, environment slots | deploy cadence, batch size per release, time spent waiting for the gate |

### 4. Give each hypothesis a prediction that can fail

For each hypothesis write: "if this is the cause, the records show X, and if it is not, they show Y." Then compute X in `compute.mjs` and record the result as a claim.

A good prediction separates hypotheses. "Spilled items took longer" is true under every hypothesis, so it tests nothing. "Spilled items are mostly planned items, and the items added mid-sprint finished first" separates demand from size.

Mark each hypothesis:

- `supported` when the prediction held and the competing hypotheses' predictions did not;
- `refuted` when the records contradict the prediction;
- `untestable` when no dataset on disk can test it, with the dataset that would.

Refuted hypotheses stay in the ledger. They show the reader that the obvious explanation was checked.

### 5. Ask why again, until the answer is actionable

Take the supported hypothesis and ask why it happens, then test that answer the same way. Keep going while the records can answer. Stop at the first cause that meets both of these conditions:

- the team or its leads can change it, and
- a change to it would remove the symptom, rather than make the symptom cheaper to absorb.

When the next why needs evidence that telemetry does not have, such as intent, contracts or org decisions, stop there. Record that limit as the diagnosis's `boundary`, phrased as the question to ask the team.

### 6. Name the root cause and how sure it is

The root cause is the deepest link in the chain that the records support. Confidence is:

- `supported` when a record pattern separates it from the competing hypotheses;
- `inferred` when it is consistent with the records but no pattern separates it. The deck must say "likely" or "consistent with" for an inferred cause, never state it as fact.

### 7. Choose remedies that act on the root cause

For each remedy, including each Anthara workflow, apply this test: **if the remedy worked perfectly, would the root cause stop happening, or would its effect be caught earlier at its source?** A remedy that only makes the symptom metric look better fails the test, and is left off.

Each remedy records which link of the chain it breaks:

- `root_cause`: it removes or prevents the cause;
- `mechanism`: it catches the cause's effect at the source, before it becomes the symptom (for example, detect the breakage and propose the fix while the change is still fresh).

A remedy that only acts on the symptom has no place in the ledger. When no workflow can act on the root cause, say so on the recommendations slide with a practice or decision for the team, and leave that finding off the Anthara slide.

## Worked shape (illustrative, not a template answer)

```text
Symptom      Most review time is spent waiting for a first review.            (claims)
Where        The wait concentrates in two repositories, all weeks alike.      (claims)
Hypotheses   Size: large pull requests wait longer                -> refuted: small ones wait as long
             Capacity: few reviewers approve most pull requests   -> supported
             Gate: a release freeze pauses review                 -> refuted: no weekly pattern
Why again    Those two repositories have one owner each, and nothing assigns a reviewer.
Root cause   Review depends on one person per repository, with no assignment.   supported
Boundary     Records cannot show why ownership is single. Ask the team whether it is deliberate.
Remedies     Reviewer rotation (root_cause), PR review on open (mechanism).
Rejected     "Remind authors about open pull requests": acts on the symptom only.
```

The answer comes from the records each time. The same symptom in another engagement can have a different cause.
