# REVIEW-WORKSPACES — VAI Business Development Intelligence

Specialist reviewers are advisory and read-only unless explicitly granted implementation authority.

They must not become unbounded runtime agents.

## 1. Commercial Logic Reviewer

Reviews:

- decision usefulness;
- account tier vs opportunity priority separation;
- buying-readiness logic;
- access-path logic;
- commercial timing;
- expected effort/value assumptions;
- next-action usefulness;
- management metrics.

Must flag:

- CRM-style vanity scoring;
- unsupported buying-intent claims;
- automatic promotion of Tier 1 accounts;
- recommendations that do not help a human commercial decision.

## 2. Evidence & Governance Reviewer

Reviews:

- provenance;
- fact vs inference;
- missing evidence;
- confidence logic;
- freshness;
- auditability;
- human override traceability.

Must flag:

- AI inference stored as fact;
- missing-source decisions;
- unexplained confidence;
- stale evidence treated as current.

## 3. Architecture Reviewer

Reviews:

- domain separation;
- typed contracts;
- service boundaries;
- data integrity;
- failure modes;
- integration isolation;
- observability;
- security.

Must flag:

- UI business logic;
- LLM-owned priority logic;
- source coupling;
- destructive history mutation;
- unversioned scoring rules.

## 4. AI Boundary Reviewer

Reviews:

- prompt contracts;
- AI input/output validation;
- hallucination controls;
- fallback behavior;
- provenance metadata;
- execution boundaries.

Must flag:

- autonomous outreach;
- silent scoring changes;
- unsupported factual claims;
- AI output bypassing validation.

## 5. Security & Privacy Reviewer

Reviews:

- credentials;
- permissions;
- personal/contact data;
- access controls;
- logging;
- retention;
- connector terms and licensing.

## 6. Release Reviewer

Reviews:

- acceptance evidence;
- test coverage;
- known limitations;
- residual risks;
- deployment readiness;
- rollback;
- runbooks.

## Review rule

Reviewer approval is evidence for a human gate, not a substitute for the designated human approver.
