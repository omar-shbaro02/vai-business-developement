# OUTPUT CONTRACT — VAI Business Development Intelligence

**Status:** APPROVED  
**Contract version:** 0.2

Runtime boundaries use versioned schemas. Unknown values remain explicit, identifiers are opaque strings, timestamps are UTC ISO-8601 values, and tenant-owned objects include `tenant_id`. Examples below are illustrative JSON shapes; implementation schemas are authoritative only after approval.

## Common enums

```text
AccountTier       = TIER_1 | TIER_2 | TIER_3 | UNCLASSIFIED
Priority          = P1_PURSUE_NOW | P2_DEVELOP | P3_MONITOR | P4_LOW_PRIORITY | INSUFFICIENT_EVIDENCE | DISQUALIFIED
Confidence        = HIGH | MEDIUM | LOW | UNKNOWN
DimensionRating   = STRONG | MODERATE | WEAK | UNKNOWN | NOT_APPLICABLE
ValueBand         = VERY_HIGH | HIGH | MEDIUM | LOW | UNKNOWN
Freshness         = CURRENT | AGING | STALE | UNKNOWN
Verification      = RAW | REVIEWED | VERIFIED | REJECTED
HypothesisStatus  = UNVERIFIED | VALIDATED | REJECTED
OpportunityStatus = DRAFT | ACTIVE | ON_HOLD | CLOSED
```

## Organization and account profile

```json
{
  "schema_version": "0.2",
  "id": "org_opaque",
  "tenant_id": "tenant_opaque",
  "legal_name": "Example LLC",
  "display_name": "Example",
  "website": "https://example.test",
  "domains": ["example.test"],
  "locations": [{"country": "US", "region": "VA", "locality": "Arlington"}],
  "industry": {"code": null, "label": "Professional services", "evidence_ids": ["ev_1"]},
  "account_profile": {
    "tier": "TIER_2",
    "tier_rule_version": "account-tier/0.1",
    "context": {},
    "evidence_ids": ["ev_1"],
    "reviewed_at": null
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Account tier is contextual metadata and is not a priority input unless an explicitly approved future rule names a distinct supporting factor. Duplicate candidates and aliases are separate resources; merges never erase prior identities.

## Evidence item

```json
{
  "schema_version": "0.2",
  "id": "ev_opaque",
  "tenant_id": "tenant_opaque",
  "organization_id": "org_opaque",
  "opportunity_id": null,
  "source": {
    "type": "MANUAL | CSV_IMPORT | APPROVED_CONNECTOR",
    "reference": "string|null",
    "source_record_id": "string|null",
    "import_id": "string|null"
  },
  "captured_at": "datetime",
  "observed_at": null,
  "evidence_type": "string",
  "raw_value": {},
  "normalized_value": null,
  "confidence": "UNKNOWN",
  "freshness": "UNKNOWN",
  "verification_status": "RAW",
  "review_notes": null,
  "created_by": "user_opaque",
  "supersedes_evidence_id": null
}
```

AI output is not represented as an EvidenceItem. AI-created extraction or reasoning is an inference resource with evidence lineage.

## Signal or inference

```json
{
  "schema_version": "0.2",
  "id": "signal_opaque",
  "tenant_id": "tenant_opaque",
  "organization_id": "org_opaque",
  "opportunity_id": null,
  "kind": "DETERMINISTIC_SIGNAL | AI_INFERENCE",
  "type": "string",
  "value": {},
  "evidence_ids": ["ev_opaque"],
  "derivation": {
    "rule_version": null,
    "provider": "string|null",
    "model": "string|null",
    "contract_version": "string|null",
    "generated_at": "datetime|null",
    "validation_status": "NOT_APPLICABLE | VALID | INVALID | NEEDS_REVIEW"
  },
  "created_at": "datetime"
}
```

An AI inference with no supporting evidence is invalid for persistence as a material commercial factor.

## Problem hypothesis and access path

```json
{
  "problem_hypothesis": {
    "id": "hyp_opaque",
    "statement": "string",
    "status": "UNVERIFIED",
    "evidence_ids": ["ev_opaque"],
    "validated_by": null,
    "validated_at": null
  },
  "access_path": {
    "id": "access_opaque",
    "type": "REFERRAL | MUTUAL_CONNECTION | EXISTING_RELATIONSHIP | EVENT | ASSOCIATION | PARTNER | INBOUND | COLD_ROUTE | OTHER | UNKNOWN",
    "strength": "HIGH | MEDIUM | LOW | UNKNOWN",
    "target_persona": "string|null",
    "known_contact_id": "string|null",
    "evidence_ids": ["ev_opaque"],
    "review_status": "UNREVIEWED | REVIEWED | REJECTED"
  }
}
```

Contact availability alone cannot produce a high or medium access strength.

## Qualification assessment

```json
{
  "schema_version": "0.2",
  "id": "assessment_opaque",
  "opportunity_id": "opp_opaque",
  "dimensions": {
    "strategic_attractiveness": {"rating": "MODERATE", "factor_ids": ["factor_1"], "evidence_ids": ["ev_1"]},
    "problem_evidence": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "buying_readiness": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "commercial_timing": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "accessibility": {"rating": "WEAK", "factor_ids": ["factor_2"], "evidence_ids": ["ev_2"]},
    "decision_maker_clarity": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "budget_plausibility": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "implementation_feasibility": {"rating": "UNKNOWN", "factor_ids": [], "evidence_ids": []},
    "expected_value": {"rating": "HIGH", "factor_ids": ["factor_3"], "evidence_ids": ["ev_3"]},
    "expected_effort": {"rating": "MODERATE", "factor_ids": ["factor_4"], "evidence_ids": ["ev_4"]},
    "risk": {"rating": "MODERATE", "factor_ids": ["factor_5"], "evidence_ids": ["ev_5"]}
  },
  "confidence": "LOW",
  "confidence_factors": [],
  "missing_evidence": [{"category": "PROBLEM", "description": "string", "material": true}],
  "rule_version": "qualification/0.1",
  "calculated_at": "datetime",
  "supersedes_assessment_id": null
}
```

Factor objects expose stable code, direction, description, evidence IDs, and rule version. Confidence factors may describe coverage, verification, freshness, consistency, and source quality but not attractiveness.

## Commercial opportunity

```json
{
  "schema_version": "0.2",
  "id": "opp_opaque",
  "tenant_id": "tenant_opaque",
  "organization_id": "org_opaque",
  "title": "string",
  "status": "DRAFT",
  "closure_reason": null,
  "problem_hypothesis_id": "hyp_opaque",
  "recommended_offer": {"offer_id": null, "label": "string", "status": "HYPOTHESIS | REVIEWED | APPROVED", "evidence_ids": []},
  "target_persona": {"role": null, "known_contact_id": null, "evidence_ids": []},
  "access_path_ids": [],
  "current_assessment_id": null,
  "current_priority_decision_id": null,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Priority decision

```json
{
  "schema_version": "0.2",
  "id": "decision_opaque",
  "opportunity_id": "opp_opaque",
  "assessment_id": "assessment_opaque",
  "priority": "INSUFFICIENT_EVIDENCE",
  "confidence": "LOW",
  "positive_factors": [],
  "negative_factors": [],
  "missing_evidence": [],
  "disqualifying_rules": [],
  "rule_version": "priority/0.1",
  "calculated_at": "datetime",
  "supersedes_priority_decision_id": null
}
```

Priority and confidence are independent outputs. Every result includes actual calculation factors; generated prose cannot modify them.

## Recommendation

```json
{
  "schema_version": "0.2",
  "id": "rec_opaque",
  "opportunity_id": "opp_opaque",
  "priority_decision_id": "decision_opaque",
  "action_type": "RESEARCH | DEVELOP_ACCESS | VALIDATE_PROBLEM | REVIEW_OFFER | PREPARE_OUTREACH | MONITOR | DEPRIORITIZE | DISQUALIFY | OTHER",
  "description": "string",
  "reason": "string",
  "supporting_evidence_ids": [],
  "material_uncertainties": [],
  "confidence": "LOW",
  "requires_human_approval": true,
  "status": "PROPOSED | APPROVED | REJECTED | EXPIRED | SUPERSEDED",
  "explanation_origin": "DETERMINISTIC | AI_ASSISTED",
  "inference_id": null,
  "created_at": "datetime",
  "expires_at": null
}
```

## Human decision and override

```json
{
  "schema_version": "0.2",
  "id": "human_decision_opaque",
  "opportunity_id": "opp_opaque",
  "system_priority_decision_id": "decision_opaque",
  "decision": "ACCEPT | REJECT | DEFER | OVERRIDE",
  "previous_state": {},
  "selected_state": {},
  "reason": "required for OVERRIDE; otherwise string|null",
  "supporting_evidence_ids": [],
  "decided_by": "user_opaque",
  "decided_at": "datetime"
}
```

## Commercial outcome

```json
{
  "schema_version": "0.2",
  "id": "outcome_opaque",
  "opportunity_id": "opp_opaque",
  "type": "RESEARCH_COMPLETED | ACCESS_PATH_FOUND | OUTREACH_ATTEMPTED | REPLY_RECEIVED | MEETING_BOOKED | MEETING_HELD | OPPORTUNITY_VALIDATED | PROPOSAL_CREATED | PROPOSAL_SENT | WON | LOST | NO_DECISION | DISQUALIFIED",
  "occurred_at": "datetime",
  "recorded_at": "datetime",
  "recorded_by": "user_opaque",
  "details": {},
  "evidence_ids": [],
  "supersedes_outcome_id": null
}
```

## Audit event

```json
{
  "schema_version": "0.2",
  "id": "audit_opaque",
  "tenant_id": "tenant_opaque",
  "actor_id": "user_opaque",
  "action": "string",
  "resource_type": "string",
  "resource_id": "string",
  "occurred_at": "datetime",
  "request_id": "string",
  "reason": "string|null",
  "before": null,
  "after": {},
  "metadata": {}
}
```

Sensitive values are redacted from audit payloads. Audit events are append-only.

## Import result

```json
{
  "schema_version": "0.2",
  "import_id": "import_opaque",
  "status": "PENDING | PROCESSING | COMPLETED | COMPLETED_WITH_ERRORS | FAILED",
  "row_count": 100,
  "accepted_count": 92,
  "rejected_count": 8,
  "duplicate_candidate_count": 3,
  "errors": [{"row": 4, "field": "website", "code": "INVALID_URL", "message": "string"}],
  "created_by": "user_opaque",
  "created_at": "datetime",
  "completed_at": null
}
```

## API envelope and errors

Successful collection responses include `data`, `page.cursor`, and `page.has_more`. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_ERROR",
    "message": "safe human-readable message",
    "request_id": "string",
    "details": []
  }
}
```

Internal stack traces, secrets, and unredacted source payloads are prohibited in API errors.

## Prohibited claims and uncertainty rules

The system must not claim confirmed problems, intent, decision-maker status, budget, relationship, execution, or commercial outcomes without supporting evidence or a system-of-record event. Incomplete data uses `UNKNOWN`, `UNVERIFIED`, or `INSUFFICIENT_EVIDENCE`; absence of evidence never becomes a positive factor.

## Compatibility rules

- Every public payload exposes `schema_version`.
- Additive compatible changes increment the minor contract version.
- Breaking changes require a new major version and migration/compatibility plan.
- Historical payloads remain readable for the approved audit-retention period.
- Unknown enum values are rejected at write boundaries and safely surfaced at read boundaries during rolling deployments.
