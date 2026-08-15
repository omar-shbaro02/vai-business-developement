# DATA GOVERNANCE — VAI Business Development Intelligence

**Status:** APPROVED  
**Version:** 0.2

## Data classes

| Class                    | Examples                                     | Handling                                                                             |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Public organization data | Website, industry, public location           | Store with source and capture time; respect source terms.                            |
| Business contact data    | Name, role, work email, profile URL          | Restricted to approved purpose and roles; retention review required.                 |
| Relationship/access data | Referrals, mutual connections, prior contact | Sensitive commercial data; least-privilege access and audit logging.                 |
| Inference                | AI hypothesis, classification, summary       | Never verified fact; preserve model/contract version and evidence links.             |
| Commercial decision data | Priority, override, notes, outcomes          | Confidential; append-preserved history.                                              |
| Secrets                  | API tokens, credentials                      | Secret manager/environment injection only; never persisted as domain data or logged. |

## Collection and source approval

Every source requires an owner, permitted-use statement, licensing/terms review, fields allowed, refresh frequency, retention rule, and deletion path before activation. Manual and CSV imports require the importer to attest that VAI may use the data for the stated business purpose.

## Minimization and provenance

- Collect only fields needed for an approved decision or research task.
- Preserve source reference, capture time, observed time when known, and actor/import identity.
- Do not copy prohibited raw content merely because a URL is public.
- Separate raw source values, normalized facts, and derived inferences.
- Redact sensitive values from logs, traces, error messages, and AI prompts.

## Retention proposal

- Raw CSV upload: delete after successful processing and a 30-day error-resolution window.
- Business contact records: review after 12 months without activity or re-verification.
- Rejected source payloads: remove sensitive raw content when no longer required; keep minimal rejection/audit metadata.
- Audit events: retain at least 24 months.
- Decision and outcome history: retain for the approved commercial and calibration period, subject to deletion obligations.

Retention periods remain proposals until owner approval and must become configurable policy, not hard-coded constants.

## Access control

- All domain access is tenant-scoped.
- API authorization is authoritative.
- Sensitive access and exports are audited.
- Production access uses individual identities and least privilege.
- Access is reviewed before pilot, quarterly thereafter, and immediately when a user leaves or changes role.

## AI handling

- AI receives the minimum evidence necessary for an approved operation.
- Prompts identify evidence IDs rather than unnecessary personal fields where possible.
- AI output is schema-validated and stored as inference with provider, model, prompt/contract version, time, validation result, and evidence lineage.
- AI failure must not block deterministic review, qualification, priority, or fallback explanations.
- No provider is enabled before its data-processing, retention, region, and training-use settings are approved.

## Export, correction, and deletion

Exports require an authorized actor, declared purpose, filters, and audit event. Corrections supersede historical records. Deletion must cascade safely through operational copies while retaining only minimal tombstone/audit data permitted by policy.

## Incident handling

Suspected unauthorized access, source misuse, secret exposure, or incorrect disclosure must create a security incident. The pilot runbook must name the response owner, containment procedure, notification path, evidence preservation approach, and recovery steps.

## Source approval record template

```text
Source:
Owner:
Purpose:
Terms/licensing reviewed by:
Allowed fields:
Prohibited fields/uses:
Authentication scope:
Refresh/rate limits:
Retention/deletion:
Approved environments:
Approval date:
Review date:
```
