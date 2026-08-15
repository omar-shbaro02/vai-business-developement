# QUALITY-AND-RELEASE — VAI Business Development Intelligence

## 1. Quality philosophy

No task, pilot, or production release is complete because code exists.

Readiness requires acceptance evidence.

## 2. Required test layers

### Unit tests

Cover:

- domain rules;
- priority calculations;
- confidence calculations;
- access logic;
- missing evidence;
- stale evidence;
- state transitions.

### Contract tests

Cover:

- API schemas;
- output contracts;
- connector contracts;
- AI structured-output contracts.
- lifecycle transition contracts;
- authorization policy contracts;
- audit event contracts.

### Integration tests

Cover:

- source -> discovery;
- discovery -> evidence;
- evidence -> qualification;
- qualification -> opportunity;
- opportunity -> priority;
- priority -> recommendation;
- human decision -> history.

### Decision regression tests

Must include approved commercial fixtures.

### End-to-end tests

Cover:

- discover/import account;
- create evidence profile;
- create opportunity;
- qualify;
- prioritize;
- recommend;
- human review;
- record decision;
- record outcome.

## 3. Critical decision-quality checks

Release must prove:

- Account Tier cannot automatically produce pursuit priority.
- Priority cannot silently control Confidence.
- Confidence cannot silently control Priority.
- Missing evidence remains missing.
- Stale evidence is surfaced.
- AI-generated hypotheses are visibly unverified.
- AI cannot modify deterministic scoring rules.
- AI explanation cannot alter calculated priority.
- Recommendations do not auto-execute.
- Human overrides are auditable.

## 4. Security checklist

- secrets excluded from repository;
- least-privilege credentials;
- authentication enabled;
- authorization enforced;
- role-based access tested;
- sensitive logs reviewed;
- personal/contact data handling documented;
- source licensing/terms reviewed;
- rate limits/error paths implemented;
- dependency vulnerabilities reviewed;
- backup/recovery approach documented.

## 5. Reliability checklist

- connector failure isolation;
- retries bounded;
- no duplicate uncontrolled ingestion;
- schema-validation failure visible;
- AI-provider outage fallback;
- database migration test;
- backup restore test before production;
- observability dashboards/logs available.
- idempotency and bounded-retry tests;
- dead-letter recovery test;
- import recovery and row-level error tests.

## 6. Data-governance checklist

- every enabled source has an approval record;
- retention rules are configured and tested;
- export and deletion paths are authorization-tested;
- logs and traces are reviewed for sensitive values;
- AI payload minimization and provider settings are approved;
- access review and offboarding paths are documented;
- raw import cleanup is tested;
- correction/supersession preserves required audit history.

## 7. Pilot gate

Pilot readiness requires:

- Product Canon approved;
- Output Contract approved;
- critical decision fixtures passing;
- no open critical security finding;
- data sources approved;
- pilot users named;
- pilot industries/geography frozen;
- success metrics defined;
- residual risks documented.
- approved decision register and architecture decisions;
- data-governance policy approved;
- accessibility review completed for critical workflows.

## 8. Production gate

Production readiness additionally requires:

- pilot findings reviewed;
- critical findings resolved;
- incident response path documented;
- backup/recovery tested;
- production monitoring active;
- user roles verified;
- retention policy implemented;
- deployment/rollback runbook approved;
- final owner approval recorded.

## 9. Release record template

```text
Release:
Date:
Environment:
Commit:
Product Canon Version:
Priority Rule Version:
Output Contract Version:
Tests:
Security Review:
Known Limitations:
Residual Risks:
Rollback Plan:
Approved By:
Approval Date:
```
