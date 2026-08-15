# ARCHITECTURE — VAI Business Development Intelligence

**Status:** APPROVED  
**Version:** 0.2 — synchronize changes through approved ADRs.

## 1. Architectural goals

The architecture must provide:

- deterministic, reproducible commercial decisions where required;
- explicit evidence provenance;
- typed contracts;
- bounded AI use;
- auditable decision history;
- human approval boundaries;
- source-agnostic discovery;
- scalable geography and industry wrappers;
- modular integrations;
- testable domain logic.

## 2. Top-level runtime architecture

```text
DATA SOURCES
    |
    v
DISCOVERY
    |
    v
NORMALIZATION
    |
    v
EVIDENCE / ENRICHMENT
    |
    v
QUALIFICATION
    |
    v
OPPORTUNITY ENGINE
    |
    v
PRIORITY ENGINE
    |
    v
RECOMMENDATION
    |
    v
HUMAN COMMERCIAL WORKSPACE
    |
    v
DECISION / OUTCOME RECORDING
    |
    v
CALIBRATION
```

## 3. Proposed repository structure

```text
apps/
  web/
  api/

packages/
  domain/
  contracts/
  scoring/
  intelligence/
  integrations/
  ui/

services/
  discovery/
  enrichment/
  qualification/
  opportunity/
  recommendation/
  evidence/

db/
  schema/
  migrations/
  seeds/

tests/
  domain/
  contracts/
  integration/
  decision/
  e2e/

docs/
  decisions/
  evidence/
  release/
```

The proposed implementation uses strict TypeScript and pnpm workspaces, Next.js for the web application, Fastify for the API, PostgreSQL with explicit migrations, and a separate worker process. The binding rationale and approval state live in `docs/decisions/`.

## 4. Domain components

### Organization
Canonical company/entity identity.

### AccountProfile
Strategic and commercial context for the organization.

### EvidenceItem
Traceable evidence with source, timestamp, confidence, type, and provenance.

### Signal
Normalized observation derived from evidence.

### ProblemHypothesis
Candidate business problem inferred from evidence. Must remain explicitly unverified unless human-validated.

### AccessPath
Credible route into the account.

### CommercialOpportunity
Canonical unit of prioritization.

### QualificationAssessment
Structured dimension-level evaluation.

### PriorityDecision
Versioned deterministic outcome of the priority engine.

### Recommendation
Human-reviewable proposed next action.

### HumanDecision
Explicit human response to the recommendation.

### CommercialOutcome
Observed downstream result used for calibration.

## 5. Discovery layer

Responsibilities:

- connect to approved sources;
- ingest approved records;
- preserve source identity;
- detect duplicate organizations;
- emit normalized raw discovery events.

The discovery layer must not assign final commercial priority.

## 6. Evidence layer

Every evidence item should support:

```text
id
organization_id
opportunity_id? 
source_type
source_reference
captured_at
observed_at?
evidence_type
raw_value
normalized_value?
confidence
freshness
review_status
created_by
```

## 7. Qualification layer

The qualification engine evaluates dimensions separately, including:

- strategic attractiveness;
- problem evidence;
- buying readiness;
- timing;
- accessibility;
- buyer clarity;
- budget plausibility;
- implementation feasibility;
- expected value;
- expected effort;
- risk;
- evidence confidence.

No final priority should be inferred by an LLM directly.

## 8. Opportunity engine

The engine creates or updates CommercialOpportunity objects from validated account context, evidence, and clearly labeled hypotheses.

One organization may contain multiple opportunities.

## 9. Priority engine

The priority engine must be:

- deterministic;
- versioned;
- schema validated;
- regression tested;
- explainable;
- independently testable from AI components.

Priority and confidence are computed independently.

## 10. Recommendation layer

Recommendations may combine:

- deterministic opportunity state;
- evidence gaps;
- AI-generated explanatory text;
- bounded next-action suggestions.

Recommendations must never execute themselves.

## 11. AI subsystem

AI calls must be isolated behind explicit interfaces.

Permitted categories:

- extraction;
- classification;
- summarization;
- hypothesis generation;
- explanation;
- research-question generation;
- offer mapping;
- human-reviewable strategy suggestion.

All AI outputs must include metadata sufficient to identify:

- prompt/contract version;
- model/provider where applicable;
- generated timestamp;
- validation status;
- originating evidence identifiers.

## 12. Prohibited AI architecture

The following architecture is prohibited:

```text
raw prospect data
    |
    v
LLM
    |
    v
opaque score
    |
    v
automatic outreach
```

## 13. Human-control layer

Writes that materially change commercial state require explicit user action.

Examples:

- approve pursuit;
- reject pursuit;
- mark opportunity disqualified;
- record outreach;
- record meeting;
- approve proposed next action;
- override priority with reason;
- validate problem hypothesis.

## 14. Data integrity

Requirements:

- immutable or append-preserved decision history;
- versioned scoring rules;
- source provenance;
- no silent mutation of verified evidence;
- audit record for human overrides;
- explicit supersession rather than destructive historical rewriting.

## 15. Security principles

- least-privilege source credentials;
- encrypted secrets;
- role-based authorization;
- tenant boundary support if productized externally;
- audit trail for sensitive changes;
- safe handling of personal/contact data;
- configurable retention;
- no credentials in source control.

## 16. API boundary

The API should expose typed domain operations rather than UI-specific logic.

Candidate API domains:

- organizations;
- evidence;
- signals;
- opportunities;
- assessments;
- decisions;
- recommendations;
- sources;
- users;
- reports.

## 17. Frontend principle

The frontend is a human commercial workspace.

It must consume domain outputs rather than reimplement business logic in UI code.

## 18. Observability

Required operational visibility:

- source ingestion failures;
- AI call failures;
- schema validation failures;
- stale evidence;
- priority recalculations;
- rule-version changes;
- override activity;
- integration health;
- security events.

## 19. Runtime and deployment boundaries

- `apps/web` renders the authenticated workspace and contains no authoritative decision logic.
- `apps/api` validates requests, authorizes capabilities, invokes domain services, and emits audit events.
- `apps/worker` processes imports, recalculations, and optional AI jobs using bounded retries and idempotency keys.
- PostgreSQL is the source of truth for domain data, versioned decisions, jobs/outbox records, and audit history.
- Deployable processes are portable containers with separate development, pilot, and production configuration.
- Configuration is validated at startup; secrets are injected and never committed.

## 20. Consistency and transaction boundaries

Evidence persistence, audit creation, and any job/outbox request caused by the write must commit atomically. Priority recalculation creates immutable snapshots and atomically changes only the opportunity's current-decision reference. Imports and connector events require idempotency keys. Merge operations are transactional and preserve aliases/provenance.

## 21. Failure behavior

- Validation failure rejects the write and returns a safe structured error.
- AI failure uses deterministic fallback and never changes priority.
- Job retries are bounded; exhausted jobs enter a visible dead-letter state.
- Partial imports report row-level failures without concealing accepted rows.
- Connector or source failure cannot corrupt existing evidence.
- Authorization failure creates a security signal without exposing protected data.

## 22. Tenancy and authorization

The MVP operates as a single VAI tenant, but tenant-owned records carry `tenant_id`. Authentication is OIDC-compatible. Authorization is capability-based and enforced by the API using the role baseline in `DOMAIN-LIFECYCLES.md`.

## 23. Architecture authority

Approved ADRs in `docs/decisions/` govern technical choices. Later changes add superseding ADRs. `OUTPUT-CONTRACT.md`, `DOMAIN-LIFECYCLES.md`, and `DATA-GOVERNANCE.md` are mandatory architecture inputs.
