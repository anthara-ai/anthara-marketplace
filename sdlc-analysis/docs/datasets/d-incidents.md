# Domain D — incidents

The capability matrix for `agents/incidents-extractor.md`. One dataset spec lives here and nowhere else — the agent points at this file instead of restating field lists. Confidence markers: `[verified]` = confirmed against a live connected server's schema in this session. `[inferred]` = pattern-matched from the provider's documented API shape, not confirmed against a live server; the agent must not depend on an `[inferred]` tool name it has not actually seen connected, and must fall back to a gap when it is absent.

**Every provider cell in this catalog is `[inferred]`.** No PagerDuty or Opsgenie MCP server is connected on this machine, and PagerDuty's API reference is JS-rendered, so it could not be fetched during authoring — there is no live schema to confirm against, for either provider. The resource models below (services, escalation policies, incidents, incident log entries, alerts, on-calls/schedules, priorities) are pattern-matched from each vendor's publicly documented concepts, not verified tool calls. Tool names in particular are a genuine environment-specific unknown: **the agent resolves them at runtime from whatever server a user actually connects**, and treats every name below as a hint to look for, never a name to call blind.

Providers known to this domain, in resolution precedence: **PagerDuty**, **Opsgenie** (see `commands/extract.md` Step 2). Opsgenie has no widely-used CLI; it is MCP-only.

---

## D1 — Services & Escalation Policies

**Requested fields:** all services — name, team ownership, escalation policy, integration sources; plus the escalation policies themselves — name, rule steps, targets, teams.

**Record shape** — two record types in one dataset (the same combined-dataset shape B4 uses for transitions + environment rules), distinguished by `record_type`:

```json
{"record_type":"service","service_id":"<id>","name":"<string>","team_ownership":"<string|null>","escalation_policy_id":"<id|null>","integration_sources":["<string>"]}
{"record_type":"escalation_policy","escalation_policy_id":"<id>","name":"<string>","teams":["<string>"],"rules":[{"target":"<string>","escalation_delay_minutes":null}]}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | A service-listing tool (list surface, name unconfirmed) for the `service` record; an escalation-policy-listing tool for the `escalation_policy` record | Service name, escalation policy linkage, team, integration list; escalation policy name, rule steps, targets, teams | **Every field here is unconfirmed** — no live server to verify names, param shapes, or exactly which fields the service object exposes (team ownership in particular may live on a separate teams/members call, not the service object itself). Confirm against the connected server before relying on any field |
| Opsgenie `[inferred]` | Opsgenie models this domain differently — Teams, and (in newer accounts) a Service construct, plus separate Escalations objects. Tool names unconfirmed | Team name, escalation rule steps and targets when an Escalations tool is confirmed present | Opsgenie's vocabulary is not a 1:1 match for PagerDuty's service/escalation-policy pair — this is a genuine anti-corruption-layer case, not a simple rename. If no Service-equivalent tool is confirmed connected, record `service` as a dataset-level gap on Opsgenie rather than guessing a mapping |

---

## D2 — Incidents

**Requested fields:** incident ID, service, title, urgency/severity, `created_at`, `acknowledged_at`, `resolved_at`, status, escalation count, number of responders, auto-resolved flag. All incidents in the window, regardless of severity.

**Record shape** (one record per incident):

```json
{"incident_id":"<id>","service_id":"<id|null>","title":"<string>","urgency":"<string|null>","severity":"<string|null>","status":"<string>","created_at":"<timestamp>","acknowledged_at":"<timestamp|null>","resolved_at":"<timestamp|null>","escalation_count":null,"responder_count":null,"auto_resolved":null}
```

**`escalation_count` and `responder_count` carry a sharper version of the no-derived-fields rule.** Both are only ever written when the resolved provider returns them as a direct field on the incident object. If the provider instead exposes only an array — e.g. a list of assignments or acknowledgements — counting that array's length ourselves is exactly the `review_count`/`comment_count` pattern the output contract forbids as a counts-as-field. In that case the correct behavior is to omit the field from the record and log it once as a gap, never to compute it.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | An incident-listing tool, likely windowed by `since`/`until`, scoped by service and/or urgency, paged by an offset or continuation token — none confirmed | incident id, title, service, urgency, status, `created_at`; `escalation_level` may exist as a direct field (unconfirmed) | `acknowledged_at`/`resolved_at` may require reading status-change history rather than being direct fields on the incident object — unconfirmed either way. `responder_count` is likely only reachable via an assignments array; if so it is a gap per the counts-as-field rule above, not a computed field |
| Opsgenie `[inferred]` | An incident- or alert-listing tool (Opsgenie's Incidents and Alerts are distinct objects; which one this dataset maps to on a given account is itself unconfirmed) | Title, status, `created_at`, priority-as-urgency-analogue | Same responder-count and acknowledged/resolved-timestamp caveats as PagerDuty, plus the incident-vs-alert vocabulary mismatch noted in D1 |

---

## D3 — Incident Timeline / Log Entries

**Requested fields, per incident:** every event — trigger, acknowledge, escalate, reassign, note added, priority change, resolve — with its own timestamp and actor.

**Record shape** — long format, one record per timeline event, never a wide incident row and never a computed duration between two events:

```json
{"incident_id":"<id>","event_type":"trigger","timestamp":"<timestamp>","actor":"<string|null>","detail":"<string|null>"}
```

`event_type` is one of `trigger`, `acknowledge`, `escalate`, `reassign`, `note`, `priority_change`, `resolve` — mapped from whatever the provider's own log-entry type actually says, never invented. `detail` carries whatever descriptive text the provider attaches to that entry verbatim (a note's body, a reassignment's target) — copied through, never summarized or truncated by this agent.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | A per-incident log-entries tool, presumably paged, called once per incident collected by D2 — this is call-amplified the same way A2's per-commit stats call is, and the same way C3's per-issue changelog call is | log entry type, timestamp, agent (actor) reference, and a type-specific detail payload | The log-entry type vocabulary and its exact field names are unconfirmed. If no per-incident log-entries tool is confirmed connected, this whole dataset is a dataset-level gap for that incident, not a field-level one |
| Opsgenie `[inferred]` | Opsgenie exposes alert/incident logs as a separate history surface; tool name and shape unconfirmed | Log entry type, timestamp, actor, when a logs tool is confirmed present | Same call-amplification and unconfirmed-vocabulary caveats as PagerDuty |

---

## D4 — Alerts

**Requested fields:** raw alerts — source, service, `created_at`, linked incident ID, suppressed/deduplicated flags.

**Record shape** (one record per alert):

```json
{"alert_id":"<id>","source":"<string|null>","service_id":"<id|null>","created_at":"<timestamp>","incident_id":"<id|null>","suppressed":null,"deduplicated":null}
```

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | A per-incident alerts tool (alerts are commonly modeled as children of an incident), called once per incident, or a top-level alerts-listing tool if one is confirmed present — either shape is unconfirmed | alert id, source/integration, `created_at`, the parent incident id | `suppressed`/`deduplicated` flags are unconfirmed as direct fields — if the provider does not expose them, omit and log the gap rather than infer a value from other fields |
| Opsgenie `[inferred]` | An alert-listing tool, likely with its own dedup-key concept | alert id, source, `created_at`, and Opsgenie's native dedup key when present | Mapping Opsgenie's dedup key onto a boolean `deduplicated` flag is not confirmed to be a faithful translation — if uncertain, pass the provider's own field through under its own name instead of coercing it into this record shape, and log the mismatch as a gap |

---

## D5 — On-Call Data

**Requested fields:** on-call schedules per team, shift durations. **Deliberately excluded: which responder was on call at the time of any given incident.** That is a join between this dataset and D2 (incidents), and a join is aggregation — this plugin does not perform it. D5 records shifts; D2 records incidents; a downstream consumer joins them on team/service and timestamp overlap if it needs that answer. This is a rule-driven omission, not an oversight.

**Record shape** (one record per on-call shift):

```json
{"schedule_id":"<id>","team":"<string|null>","user":"<string|null>","start":"<timestamp>","end":"<timestamp>"}
```

A shift's `start` and `end` are copied verbatim. **No `duration` field is computed from them** — that would be exactly the derived-timestamp-math the output contract forbids. If, and only if, the resolved provider's own API returns an explicit duration value on the shift object itself (a provider-computed field, not one this agent computes), it may be passed through verbatim under its own name; it is never synthesized from `start`/`end` here.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | A schedule-listing tool for schedule definitions, plus a rendered-entries surface per schedule for the actual shift start/end times — exact tool names and whether a single call returns both are unconfirmed | schedule name/team, shift start/end, on-call user | Whether the connected surface exposes a rendered-entries call at all is unconfirmed; if not, shifts are a dataset-level gap while the schedule *definition* (D1-adjacent metadata, not this dataset) may still be partially obtainable |
| Opsgenie `[inferred]` | A schedule/on-call-listing tool; Opsgenie's schedule and rotation model is documented separately from PagerDuty's and the two are not assumed equivalent | Schedule/team, rotation participant, shift start/end when confirmed present | Same unconfirmed-surface caveat as PagerDuty, plus the schedule-vs-rotation vocabulary difference between the two providers |

---

## D6 — Priority / Severity Definitions

**Requested fields:** the org-wide priority/severity scheme itself (e.g. what P1–P5 or SEV1–SEV3 mean); plus, per incident, whether it was flagged for a postmortem, its priority field value, and any custom fields present (e.g. a "caused by deploy" tag).

**Record shape** — two record types in one dataset, distinguished by `record_type`, the same combined-dataset shape as D1:

```json
{"record_type":"priority_definition","priority_id":"<id>","name":"<string>","description":"<string|null>"}
{"record_type":"incident_metadata","incident_id":"<id>","priority":"<string|null>","postmortem_flagged":null,"custom_fields":{}}
```

`custom_fields` is copied through as whatever key/value shape the provider itself returns for that incident's custom fields — never restructured, renamed, or reduced to a fixed key set by this agent.

| Provider | Tool + params | Obtainable fields | Known gaps |
|---|---|---|---|
| PagerDuty `[inferred]` | A priorities-listing tool for `priority_definition`; incident-level `priority` and any custom-fields surface for `incident_metadata` — both unconfirmed. A dedicated postmortem/post-incident-review feature exists on some PagerDuty plans, but no tool exposing a postmortem flag has been confirmed | Priority id/name/description when the priorities tool is present; incident `priority` value when confirmed present | `postmortem_flagged` is the least confirmed field in this whole catalog — if no tool surfaces it, omit it from `incident_metadata` and log the gap explicitly rather than defaulting it to `false`, which would misrepresent absence-of-data as a negative answer |
| Opsgenie `[inferred]` | Opsgenie's priority levels (P1–P5) are a documented concept but the listing tool is unconfirmed; no widely-documented postmortem-flag surface is known for Opsgenie | Priority value on the alert/incident object when confirmed present | Priority-definition listing and postmortem flagging are both dataset-or-field-level gaps on Opsgenie until a connected server proves otherwise |
