# PROJECT-TASKS — VAI Business Development Intelligence

## Operating rule

Tasks are executed in order unless the project owner explicitly approves a dependency change.

A task is not complete because files exist. It is complete only when acceptance criteria and relevant tests pass.

---

## PHASE 0 — PRODUCT FREEZE

### TASK 001 — Approve Project Spec
**Status:** COMPLETE

Acceptance:
- Project owner reviews all sections.
- Open decisions are resolved or explicitly deferred.
- Initial MVP geography and industry scope are named.
- Initial approved data sources are named.

### TASK 002 — Approve Product Canon
**Status:** COMPLETE

Depends on: TASK 001

Acceptance:
- canonical unit of decision approved;
- users and decision owners approved;
- AI boundaries approved;
- human-control boundaries approved;
- priority state model approved;
- confidence model approved;
- non-goals approved.

**HUMAN GATE:** Stop until explicit approval.

### TASK 003 — Approve MVP Decision Register
**Status:** COMPLETE

Depends on: TASK 001

Acceptance:
- each proposed product, pilot, technical, and governance decision is approved, changed, rejected, or explicitly deferred;
- named approvers and approval date recorded;
- no `TBD` item required for implementation remains unresolved.

### TASK 004 — Approve contracts and lifecycles
**Status:** COMPLETE

Depends on: TASK 001

Acceptance:
- Output Contract enums and object boundaries approved;
- lifecycle transitions and actor boundaries approved;
- unknown and supersession behavior approved;
- contract version frozen.

### TASK 005 — Approve architecture and data governance
**Status:** COMPLETE

Depends on: TASK 001

Acceptance:
- ADR-001 through ADR-004 approved or replaced;
- source, retention, access, AI handling, export, and deletion policies approved;
- architecture and governance approvers recorded.

**HUMAN GATE:** TASKS 001–005 must be complete before runtime implementation.

---

## PHASE 0B — ENGINEERING FOUNDATION

### TASK 006 — Initialize repository and engineering tooling
**Status:** NOT_STARTED

Depends on: TASKS 002–005

Acceptance:
- workspace, applications, packages, and test structure match approved ADRs;
- runtime/package versions pinned;
- formatting, linting, typecheck, unit-test, and build commands pass;
- `.gitignore`, environment example, ownership, and contribution guidance present.

### TASK 007 — Implement continuous integration
**Status:** NOT_STARTED

Depends on: TASK 006

Acceptance:
- clean install, formatting, lint, typecheck, unit tests, contract tests, and build run on every change;
- dependency and secret scanning configured;
- failed gates prevent release claims.

### TASK 008 — Implement configuration and observability foundation
**Status:** NOT_STARTED

Depends on: TASK 006

Acceptance:
- startup configuration is typed and validated;
- development, test, pilot, and production boundaries explicit;
- structured logs carry request/job IDs and redact sensitive fields;
- health/readiness checks and error reporting available.

### TASK 009 — Implement identity, authorization, and audit foundations
**Status:** NOT_STARTED

Depends on: TASK 006

Acceptance:
- authenticated actor and tenant context required at protected boundaries;
- role/capability policy is API-enforced and tested;
- material writes emit typed audit events for transactional persistence by TASK 023;
- production authentication bypass is impossible.

---

## PHASE 1 — DOMAIN AND CONTRACTS

### TASK 010 — Implement domain types
Create typed models for:
- Organization
- AccountProfile
- EvidenceItem
- Signal
- ProblemHypothesis
- AccessPath
- CommercialOpportunity
- QualificationAssessment
- PriorityDecision
- Recommendation
- HumanDecision
- CommercialOutcome

Acceptance:
- compile/typecheck passes;
- invalid enum values rejected;
- relationship cardinalities tested.

### TASK 011 — Implement output schemas
Acceptance:
- schemas reflect `OUTPUT-CONTRACT.md`;
- malformed payload tests fail correctly;
- unknown/missing states supported;
- schema versions exposed.

### TASK 012 — Implement rule-version framework
Acceptance:
- every priority result records exact rule version;
- historical results remain reproducible;
- rule changes cannot silently overwrite history.

### TASK 013 — Implement lifecycle transition framework
Acceptance:
- transitions match `DOMAIN-LIFECYCLES.md`;
- prohibited transitions fail with explicit errors;
- actor, reason, time, and supersession references retained;
- transition contract tests pass.

---

## PHASE 2 — DATA FOUNDATION

### TASK 020 — Implement database schema
Acceptance:
- migrations pass from empty database;
- rollback path documented;
- indexes defined for major lookup paths;
- provenance fields present;
- audit fields present.

### TASK 021 — Implement organization identity and deduplication
Acceptance:
- duplicate candidates detected;
- manual merge path exists;
- merge retains provenance;
- no destructive silent merges.

### TASK 022 — Implement evidence store
Acceptance:
- evidence source and timestamps retained;
- evidence can be marked stale/rejected/verified;
- AI inference cannot masquerade as evidence.

### TASK 023 — Implement audit and history store
Acceptance:
- audit records append-only;
- sensitive fields redacted;
- authorized history queries supported;
- superseded records remain reproducible.

### TASK 024 — Implement job/outbox and idempotency foundation
Acceptance:
- writes and requested jobs commit atomically;
- duplicate idempotency keys do not duplicate effects;
- retries bounded with visible terminal failures;
- worker recovery tests pass.

---

## PHASE 3 — DISCOVERY

### TASK 030 — Implement source adapter contract
Acceptance:
- all discovery connectors conform to common interface;
- source failure isolated;
- raw source reference retained.

### TASK 031 — Implement manual/CSV discovery source
Acceptance:
- valid file import works;
- invalid rows reported;
- duplicate handling tested;
- source provenance retained.
- raw import cleanup follows approved retention policy;
- importer permission attestation recorded.

### TASK 032 — Implement first approved external source
Only after source/legal/terms approval.

Acceptance:
- credential handling secure;
- rate/error handling implemented;
- source terms documented;
- normalized discovery events created.

---

## PHASE 4 — ENRICHMENT AND SIGNALS

### TASK 040 — Implement normalized account profile
Acceptance:
- identity, geography, industry, size/context fields supported;
- unknown data remains unknown;
- freshness visible.

### TASK 041 — Implement signal extraction pipeline
Acceptance:
- each signal points to supporting evidence;
- deterministic signals covered by unit tests;
- AI-derived signals labeled as AI-assisted.

### TASK 042 — Implement bounded AI extraction
Acceptance:
- typed input/output contract;
- model failure path;
- validation before persistence;
- provenance metadata retained;
- hallucinated unsupported facts rejected by validation path.

---

## PHASE 5 — QUALIFICATION

### TASK 050 — Implement qualification dimensions
Acceptance:
- dimensions calculated independently;
- missing data handling explicit;
- dimension outputs explain contributing evidence.

### TASK 051 — Implement access-path assessment
Acceptance:
- contact availability cannot alone become strong access;
- access evidence required;
- unknown access supported.

### TASK 052 — Implement evidence-confidence engine
Acceptance:
- independent from opportunity attractiveness;
- confidence regression fixtures pass;
- stale/missing evidence downgrades correctly.

---

## PHASE 6 — OPPORTUNITY ENGINE

### TASK 060 — Implement CommercialOpportunity lifecycle
Acceptance:
- one organization can hold multiple opportunities;
- each opportunity has separate buyer/problem/access/priority state;
- historical state retained.

### TASK 061 — Implement problem-hypothesis workflow
Acceptance:
- hypotheses are explicitly unverified by default;
- validation/rejection requires human action or approved verified evidence;
- rejected hypotheses remain auditable.

### TASK 062 — Implement VAI offer mapping
Acceptance:
- mappings are explainable;
- mappings can be reviewed/overridden;
- AI suggestions never become approved offers automatically.

---

## PHASE 7 — PRIORITY ENGINE

### TASK 070 — Freeze priority rules
**HUMAN GATE**

Acceptance:
- dimensions approved;
- weights/thresholds approved;
- disqualification rules approved;
- insufficient-evidence rules approved.

### TASK 071 — Implement deterministic priority engine
Acceptance:
- identical inputs produce identical outputs;
- priority and confidence separate;
- rule version recorded;
- missing evidence cannot default positively;
- explanations match actual calculation factors.

### TASK 072 — Build decision fixtures
Fixtures must include:
- attractive Tier 1 but inaccessible account;
- smaller Tier 3 with strong immediate opportunity;
- P1 with low confidence;
- high confidence but low priority;
- insufficient evidence;
- disqualified case;
- conflicting evidence;
- stale evidence.

Acceptance:
- all expected outputs explicitly approved;
- regression tests pass.

---

## PHASE 8 — RECOMMENDATION

### TASK 080 — Implement next-action engine
Acceptance:
- actions are human-reviewable;
- no action auto-executes;
- missing evidence can produce research action;
- access weakness can produce access-development action.

### TASK 081 — Implement bounded AI explanation layer
Acceptance:
- explanation cannot alter deterministic priority;
- explanation references actual factors;
- unsupported claims blocked;
- failure falls back to deterministic explanation.

---

## PHASE 9 — API

### TASK 090 — Implement domain APIs
Acceptance:
- typed requests/responses;
- authorization checks;
- validation errors explicit;
- audit history exposed where authorized.
- pagination/filter and error envelopes match the Output Contract.

### TASK 091 — Implement decision/override APIs
Acceptance:
- override reason required;
- old state retained;
- user/timestamp recorded.

---

## PHASE 10 — HUMAN WORKSPACE

### TASK 100 — Build Executive Overview
Acceptance:
- displays governed aggregate metrics;
- no misleading lead-volume vanity metric as primary decision signal.

### TASK 101 — Build Accounts workspace
Acceptance:
- account context distinct from opportunity priority;
- evidence provenance accessible.

### TASK 102 — Build Opportunities workspace
Acceptance:
- priority, confidence, evidence, gaps, access, offer, and next action visible;
- multiple opportunities per account supported.

### TASK 103 — Build Research workspace
Acceptance:
- insufficient-evidence cases visible;
- missing evidence drives research checklist;
- new evidence updates assessments through approved pipeline.

### TASK 104 — Build Decision history
Acceptance:
- system recommendation;
- human decision;
- override reason;
- timestamp;
- outcome history visible.

### TASK 105 — Accessibility and workspace usability review
Acceptance:
- critical workflows are keyboard operable;
- labels, focus, error messages, and status distinctions are accessible;
- priority and confidence are not communicated by color alone;
- critical issues are resolved before pilot.

---

## PHASE 11 — REPORTING AND CALIBRATION

### TASK 110 — Implement management reporting
Acceptance:
- BD allocation view;
- opportunity state distribution;
- confidence distribution;
- research backlog;
- outcome funnel;
- qualified opportunity value per BD hour where data permits.

### TASK 111 — Implement outcome calibration
Acceptance:
- outcomes do not rewrite historical recommendations;
- historical recommendation vs outcome comparison supported;
- metrics versioned.

---

## PHASE 12 — SECURITY, QUALITY, RELEASE

### TASK 120 — Security review
Follow `QUALITY-AND-RELEASE.md`.

### TASK 120A — Data-governance review
Acceptance:
- enabled source approvals recorded;
- retention/export/deletion controls tested;
- logging and AI payload review complete;
- residual privacy and licensing risks documented.

### TASK 120B — Backup and recovery exercise
Acceptance:
- migration from empty database passes;
- backup restoration demonstrated in a non-production environment;
- recovery time and data-loss observations recorded;
- runbook corrected from exercise findings.

### TASK 121 — Decision-quality review
Acceptance:
- regression fixtures pass;
- no priority/confidence leakage;
- unknowns preserved;
- AI boundary tests pass.

### TASK 122 — Pilot readiness review
**HUMAN GATE**

Acceptance:
- all critical tests pass;
- residual risks documented;
- pilot users named;
- pilot success criteria frozen.

### TASK 123 — Production readiness review
**HUMAN GATE**

Acceptance:
- pilot findings resolved or accepted;
- security approved;
- operational runbooks approved;
- rollback/recovery documented;
- final approval record signed.
