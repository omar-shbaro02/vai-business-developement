# DOMAIN LIFECYCLES — VAI Business Development Intelligence

**Status:** APPROVED  
**Version:** 0.2

State changes are API-enforced, authorized, timestamped, and appended to audit history. Historical decision records are never edited in place.

## Evidence lifecycle

`RAW -> REVIEWED -> VERIFIED`

From `RAW` or `REVIEWED`, evidence may move to `REJECTED`. `VERIFIED` evidence may be superseded or marked stale but not silently demoted or overwritten.

- `RAW`: captured but not reviewed.
- `REVIEWED`: a human assessed source, meaning, and provenance.
- `VERIFIED`: a human confirmed the claim is supported to the approved standard.
- `REJECTED`: unusable, contradicted, incorrectly attributed, or prohibited.
- Freshness (`CURRENT`, `AGING`, `STALE`, `UNKNOWN`) is independent of verification.
- AI output is not evidence. It is an inference linked to the evidence that produced it.

## Problem hypothesis lifecycle

`UNVERIFIED -> VALIDATED | REJECTED`

Validated and rejected hypotheses may be superseded by a new version. Only a human with the appropriate capability may validate or reject. New evidence may request review but may not perform the transition autonomously.

## Opportunity lifecycle

`DRAFT -> ACTIVE -> ON_HOLD -> CLOSED`

- `DRAFT`: incomplete and not eligible for pursuit approval.
- `ACTIVE`: eligible for qualification and recommendation.
- `ON_HOLD`: intentionally paused; reason and review date required.
- `CLOSED`: terminal business state with `WON`, `LOST`, `NO_DECISION`, or `DISQUALIFIED` closure reason.
- Closed opportunities may be reopened only by a commercial owner; reopening creates a new lifecycle version while preserving history.
- Priority is a versioned decision output, not an opportunity lifecycle state.

## Assessment and priority lifecycle

Assessments and priority decisions are immutable snapshots.

1. An evidence or approved-rule change makes the current assessment `STALE`.
2. Recalculation creates a new assessment and priority decision.
3. The previous decision becomes `SUPERSEDED` but remains queryable.
4. A human override creates a separate `HumanDecision`; it never edits the system decision.

## Recommendation lifecycle

`PROPOSED -> APPROVED | REJECTED | EXPIRED | SUPERSEDED`

Approval authorizes a human to act; it does not claim that action occurred. Execution is recorded separately as an outcome/activity event. Recommendations expire when their evidence or priority decision is superseded.

## Human decision lifecycle

Human decisions are append-only and include `ACCEPT`, `REJECT`, `DEFER`, or `OVERRIDE`. An override requires a reason and records previous system state, selected state, actor, time, and optional evidence.

## Outcome lifecycle

Outcomes are append-only events. Corrections use a superseding event linked to the erroneous event. Outcomes never retroactively modify a recommendation, priority decision, or evidence item.

## Organization merge lifecycle

1. A possible duplicate creates a merge candidate.
2. An authorized human reviews source identities and conflicts.
3. Approval creates canonical-to-alias mappings and moves relationships transactionally.
4. Source provenance and previous organization identifiers remain queryable.
5. A merge can be reversed through an audited recovery operation; no silent destructive merge is permitted.

## Authorization summary

| Action                                | Allowed roles                                    |
| ------------------------------------- | ------------------------------------------------ |
| Capture evidence or draft opportunity | ADMIN, COMMERCIAL_OWNER, BD_OPERATOR, RESEARCHER |
| Review evidence                       | ADMIN, COMMERCIAL_OWNER, REVIEWER                |
| Verify/reject evidence                | ADMIN, COMMERCIAL_OWNER, REVIEWER                |
| Validate/reject hypothesis            | ADMIN, COMMERCIAL_OWNER, REVIEWER                |
| Approve pursuit or override priority  | ADMIN, COMMERCIAL_OWNER                          |
| Record activity/outcome               | ADMIN, COMMERCIAL_OWNER, BD_OPERATOR             |
| Merge organizations                   | ADMIN, COMMERCIAL_OWNER                          |
| Change rule/config version            | ADMIN plus recorded commercial approval          |
| Read governed data                    | Any authorized role within tenant scope          |

Exact permissions are versioned policy data and tested at the API boundary.
