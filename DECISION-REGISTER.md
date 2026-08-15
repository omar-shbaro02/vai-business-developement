# DECISION REGISTER — VAI Business Development Intelligence

**Status:** APPROVED  
**Version:** 0.2  
**Prepared:** 2026-08-15

This register converts open questions into explicit MVP proposals or deferrals. A proposal is not approved until the approval record at the end of this file is completed.

## Decision states

- `PROPOSED`: recommended for the MVP, awaiting owner approval.
- `APPROVED`: binding for the named version.
- `DEFERRED`: intentionally outside the MVP.
- `REJECTED`: considered and not selected.
- `SUPERSEDED`: replaced by a later recorded decision.

## Product and pilot decisions

| ID      | Decision                  | Proposed MVP choice                                                                                                                                                                                           | State    | Rationale / constraint                                                                                              |
| ------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| DEC-001 | Geography                 | Northern Virginia: Arlington, Alexandria, Fairfax County, Loudoun County, and Prince William County                                                                                                           | APPROVED | Matches the stated operating region while creating a testable boundary.                                             |
| DEC-002 | Industries                | Professional services, B2B technology/services, and trade/logistics businesses                                                                                                                                | APPROVED | Broad enough to exercise the model, narrow enough for comparable fixtures. Owner may replace these before approval. |
| DEC-003 | Discovery sources         | Manual entry and CSV import only                                                                                                                                                                              | APPROVED | Establishes deterministic provenance without source licensing or connector risk.                                    |
| DEC-004 | External source connector | First external connector deferred until source, licensing, and retention review                                                                                                                               | DEFERRED | Avoids embedding an unapproved source dependency in the MVP.                                                        |
| DEC-005 | CRM integration           | No CRM write integration in MVP; export/read integration considered after pilot                                                                                                                               | DEFERRED | Preserves the human-control boundary and reduces synchronization risk.                                              |
| DEC-006 | Account tiers             | Contextual `TIER_1`, `TIER_2`, `TIER_3`, or `UNCLASSIFIED`; classification based on approved strategic criteria and never fed directly into priority                                                          | APPROVED | Preserves the canonical separation rule. Exact criteria require commercial-owner approval.                          |
| DEC-007 | Priority states           | `P1_PURSUE_NOW`, `P2_DEVELOP`, `P3_MONITOR`, `P4_LOW_PRIORITY`, `INSUFFICIENT_EVIDENCE`, `DISQUALIFIED`                                                                                                       | APPROVED | Matches the Product Canon candidate model.                                                                          |
| DEC-008 | Confidence states         | `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`; calculated only from evidence quality and coverage                                                                                                                        | APPROVED | Adds `UNKNOWN` for zero/invalid evidence and prevents optimistic defaults.                                          |
| DEC-009 | Qualification scale       | Each dimension is `STRONG`, `MODERATE`, `WEAK`, `UNKNOWN`, or `NOT_APPLICABLE`, with factor and evidence references                                                                                           | APPROVED | Replaces unrestricted strings with an explainable contract.                                                         |
| DEC-010 | Priority method           | Deterministic decision table with hard gates, then versioned factor rules; no LLM and no account-tier shortcut                                                                                                | APPROVED | Easier to approve and regress than an opaque aggregate score. Exact rules remain a Phase 7 human gate.              |
| DEC-011 | Minimum evidence          | P1/P2 requires non-rejected evidence for problem, timing/readiness, target persona, and access route; P1 additionally requires reviewed evidence in at least three of those four categories                   | APPROVED | Starting policy for fixtures only; must be frozen with priority rules.                                              |
| DEC-012 | Expected value            | Ordinal band: `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`; no currency forecast in MVP                                                                                                                    | APPROVED | Avoids false financial precision before outcome data exists.                                                        |
| DEC-013 | Expected effort           | Ordinal band: `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`, supported by explicit factors                                                                                                                  | APPROVED | Enables comparison while preserving uncertainty.                                                                    |
| DEC-014 | Initial roles             | `ADMIN`, `COMMERCIAL_OWNER`, `BD_OPERATOR`, `RESEARCHER`, `REVIEWER`, `READ_ONLY`                                                                                                                             | APPROVED | Supports least privilege and human gates.                                                                           |
| DEC-015 | Pilot users               | One commercial owner, two BD operators, and one reviewer; names recorded before pilot                                                                                                                         | APPROVED | Creates a small controlled feedback group.                                                                          |
| DEC-016 | Pilot duration            | Six weeks after pilot readiness approval                                                                                                                                                                      | APPROVED | Long enough to observe research-to-meeting progression without implying sales-cycle closure.                        |
| DEC-017 | Pilot success             | At least 90% traceable priority decisions; median discovery-to-decision time reduced by 25% from a measured baseline; zero unapproved automated actions; critical user-rated decision usefulness at least 4/5 | APPROVED | Balances governance, efficiency, safety, and usefulness. Baseline must be collected before pilot.                   |

## Technical decisions

| ID      | Decision           | Proposed choice                                                                                                  | State    |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- | -------- |
| DEC-020 | Repository         | Git monorepo with strict TypeScript and pnpm workspaces                                                          | APPROVED |
| DEC-021 | Runtime boundaries | Separate web application, API application, domain packages, and worker process                                   | APPROVED |
| DEC-022 | Web                | Next.js with server-rendered authenticated workspace UI                                                          | APPROVED |
| DEC-023 | API                | Fastify HTTP API with generated OpenAPI and runtime schema validation                                            | APPROVED |
| DEC-024 | Database           | PostgreSQL with explicit migrations and transaction-backed audit/history records                                 | APPROVED |
| DEC-025 | Data access        | Drizzle ORM/query layer; domain logic must not depend on ORM models                                              | APPROVED |
| DEC-026 | Background work    | PostgreSQL-backed job/outbox tables for MVP; bounded retries and idempotency keys                                | APPROVED |
| DEC-027 | Authentication     | OIDC-compatible identity provider; local development adapter allowed, never production bypass                    | APPROVED |
| DEC-028 | Authorization      | API-enforced role and capability checks; frontend visibility is not authorization                                | APPROVED |
| DEC-029 | Deployment         | Portable OCI containers with development, pilot, and production environments                                     | APPROVED |
| DEC-030 | AI integration     | Provider-neutral adapter, schema-validated outputs, disabled unless configured; deterministic fallback required  | APPROVED |
| DEC-031 | Tenancy            | Single VAI tenant in MVP; every tenant-owned table still carries `tenant_id` to preserve a future migration path | APPROVED |
| DEC-032 | File import        | Streaming CSV validation; raw import retained only per approved retention policy; row errors downloadable        | APPROVED |

## Governance decisions

| ID      | Decision                    | Proposed choice                                                                                                                        | State    |
| ------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| DEC-040 | Contact-data retention      | 12 months after last review or activity, followed by review/deletion unless legally or commercially justified                          | APPROVED |
| DEC-041 | Rejected evidence retention | Retain metadata and rejection history; restrict or redact sensitive raw payloads according to source terms                             | APPROVED |
| DEC-042 | Decision history            | Append-only; corrections create superseding records                                                                                    | APPROVED |
| DEC-043 | Audit retention             | 24 months minimum for MVP/pilot records                                                                                                | APPROVED |
| DEC-044 | AI-provider data            | Send minimum necessary content; do not send secrets or unapproved sensitive/contact fields; provider training disabled where supported | APPROVED |
| DEC-045 | Export/deletion             | Admin-controlled export; deletion produces an auditable tombstone and preserves only legally required metadata                         | APPROVED |

## Proposed account-tier criteria

Tier is assigned only after human review and describes potential account context:

- `TIER_1`: organization plausibly supports very high strategic or commercial value, has multi-unit/market leverage, or carries exceptional reference/partnership value.
- `TIER_2`: organization plausibly supports meaningful recurring or project value and has credible strategic relevance, without Tier 1 scale or leverage.
- `TIER_3`: smaller, local, emerging, or narrowly scoped organization with lower aggregate upside but potentially faster access or execution.
- `UNCLASSIFIED`: evidence is insufficient or no human classification has occurred.

Tier assignment must cite reviewed evidence and `account-tier` rule version. Accessibility, current timing, and contact availability do not determine tier, and tier never automatically changes opportunity priority.

## Proposed value and effort rubric

Expected value considers plausible deal band, recurrence, expansion, reference value, strategic learning, and partnership leverage. Expected effort considers research, access development, solution design, procurement complexity, delivery preparation, and expected elapsed time. Each rating must expose factors and evidence; `UNKNOWN` is mandatory when material inputs are missing. Currency forecasts and probability-weighted pipeline values are deferred until validated outcome data exists.

## Approval scope

The owner confirmed DEC-001, DEC-002, DEC-006, DEC-011, DEC-014 through DEC-017, and DEC-040. Technical decisions DEC-020 through DEC-032 received architecture approval. Changes require a versioned superseding decision.

## Approval record

**Product Owner:** Omar / VAI  
**Commercial Approver:** Omar / VAI  
**Architecture Approver:** Omar / VAI  
**Approved decision IDs:** DEC-001–DEC-003, DEC-006–DEC-017, DEC-020–DEC-032, DEC-040–DEC-045  
**Deferred decision IDs:** DEC-004, DEC-005  
**Approval date:** 2026-08-15
