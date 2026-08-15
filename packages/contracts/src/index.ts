import { z } from "zod";
import {
  accountTiers,
  confidences,
  dimensionRatings,
  freshnessValues,
  hypothesisStatuses,
  opportunityStatuses,
  priorities,
  recommendationStatuses,
  verificationStatuses,
} from "@vai/domain";

export const CONTRACT_VERSION = "0.2" as const;
const schemaVersion = z.literal(CONTRACT_VERSION);
const id = z.string().min(1);
const nullableId = id.nullable();
const dateTime = z.iso.datetime({ offset: true });

export const accountTierSchema = z.enum(accountTiers);
export const prioritySchema = z.enum(priorities);
export const confidenceSchema = z.enum(confidences);
export const dimensionRatingSchema = z.enum(dimensionRatings);
export const freshnessSchema = z.enum(freshnessValues);
export const verificationSchema = z.enum(verificationStatuses);
export const hypothesisStatusSchema = z.enum(hypothesisStatuses);
export const opportunityStatusSchema = z.enum(opportunityStatuses);

export const organizationSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    tenant_id: id,
    legal_name: z.string().min(1),
    display_name: z.string().min(1),
    website: z.url().nullable(),
    domains: z.array(z.string().min(1)),
    locations: z.array(
      z
        .object({
          country: z.string().min(2),
          region: z.string().nullable(),
          locality: z.string().nullable(),
        })
        .strict(),
    ),
    account_profile: z
      .object({
        tier: accountTierSchema,
        tier_rule_version: z.string().min(1),
        context: z.record(z.string(), z.unknown()),
        evidence_ids: z.array(id),
        reviewed_at: dateTime.nullable(),
      })
      .strict(),
    created_at: dateTime,
    updated_at: dateTime,
  })
  .strict();

export const evidenceSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    tenant_id: id,
    organization_id: id,
    opportunity_id: nullableId,
    source: z
      .object({
        type: z.enum(["MANUAL", "CSV_IMPORT", "APPROVED_CONNECTOR"]),
        reference: z.string().nullable(),
        source_record_id: z.string().nullable(),
        import_id: nullableId,
      })
      .strict(),
    captured_at: dateTime,
    observed_at: dateTime.nullable(),
    evidence_type: z.string().min(1),
    raw_value: z.unknown(),
    normalized_value: z.unknown().nullable(),
    confidence: confidenceSchema,
    freshness: freshnessSchema,
    verification_status: verificationSchema,
    review_notes: z.string().nullable(),
    created_by: id,
    supersedes_evidence_id: nullableId,
  })
  .strict();

export const signalSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    tenant_id: id,
    organization_id: id,
    opportunity_id: nullableId,
    kind: z.enum(["DETERMINISTIC_SIGNAL", "AI_INFERENCE"]),
    type: z.string().min(1),
    value: z.unknown(),
    evidence_ids: z.array(id),
    derivation: z
      .object({
        rule_version: z.string().nullable(),
        provider: z.string().nullable(),
        model: z.string().nullable(),
        contract_version: z.string().nullable(),
        generated_at: dateTime.nullable(),
        validation_status: z.enum([
          "NOT_APPLICABLE",
          "VALID",
          "INVALID",
          "NEEDS_REVIEW",
        ]),
      })
      .strict(),
    created_at: dateTime,
  })
  .strict()
  .superRefine((signal, context) => {
    if (signal.kind === "AI_INFERENCE" && signal.evidence_ids.length === 0)
      context.addIssue({
        code: "custom",
        message: "AI inference requires supporting evidence",
        path: ["evidence_ids"],
      });
  });

export const problemHypothesisSchema = z
  .object({
    id,
    statement: z.string().min(1),
    status: hypothesisStatusSchema,
    evidence_ids: z.array(id),
    validated_by: nullableId,
    validated_at: dateTime.nullable(),
  })
  .strict();

export const accessPathSchema = z
  .object({
    id,
    type: z.enum([
      "REFERRAL",
      "MUTUAL_CONNECTION",
      "EXISTING_RELATIONSHIP",
      "EVENT",
      "ASSOCIATION",
      "PARTNER",
      "INBOUND",
      "COLD_ROUTE",
      "OTHER",
      "UNKNOWN",
    ]),
    strength: confidenceSchema,
    target_persona: z.string().nullable(),
    known_contact_id: nullableId,
    evidence_ids: z.array(id),
    review_status: z.enum(["UNREVIEWED", "REVIEWED", "REJECTED"]),
  })
  .strict()
  .superRefine((path, context) => {
    if (
      (path.strength === "HIGH" || path.strength === "MEDIUM") &&
      path.evidence_ids.length === 0
    )
      context.addIssue({
        code: "custom",
        message: "Strong access requires evidence",
        path: ["evidence_ids"],
      });
  });

const dimensionSchema = z
  .object({
    rating: dimensionRatingSchema,
    factor_ids: z.array(id),
    evidence_ids: z.array(id),
  })
  .strict();
const dimensionsSchema = z
  .object({
    strategic_attractiveness: dimensionSchema,
    problem_evidence: dimensionSchema,
    buying_readiness: dimensionSchema,
    commercial_timing: dimensionSchema,
    accessibility: dimensionSchema,
    decision_maker_clarity: dimensionSchema,
    budget_plausibility: dimensionSchema,
    implementation_feasibility: dimensionSchema,
    expected_value: dimensionSchema,
    expected_effort: dimensionSchema,
    risk: dimensionSchema,
  })
  .strict();

export const qualificationAssessmentSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    opportunity_id: id,
    dimensions: dimensionsSchema,
    confidence: confidenceSchema,
    confidence_factors: z.array(z.unknown()),
    missing_evidence: z.array(
      z
        .object({
          category: z.string(),
          description: z.string(),
          material: z.boolean(),
        })
        .strict(),
    ),
    rule_version: z.string().min(1),
    calculated_at: dateTime,
    supersedes_assessment_id: nullableId,
  })
  .strict();

export const commercialOpportunitySchema = z
  .object({
    schema_version: schemaVersion,
    id,
    tenant_id: id,
    organization_id: id,
    title: z.string().min(1),
    status: opportunityStatusSchema,
    closure_reason: z
      .enum(["WON", "LOST", "NO_DECISION", "DISQUALIFIED"])
      .nullable(),
    problem_hypothesis_id: id,
    recommended_offer: z
      .object({
        offer_id: nullableId,
        label: z.string(),
        status: z.enum(["HYPOTHESIS", "REVIEWED", "APPROVED"]),
        evidence_ids: z.array(id),
      })
      .strict(),
    target_persona: z
      .object({
        role: z.string().nullable(),
        known_contact_id: nullableId,
        evidence_ids: z.array(id),
      })
      .strict(),
    access_path_ids: z.array(id),
    current_assessment_id: nullableId,
    current_priority_decision_id: nullableId,
    created_at: dateTime,
    updated_at: dateTime,
  })
  .strict();

const reasoningFactorSchema = z
  .object({
    code: z.string().min(1),
    direction: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
    description: z.string(),
    evidence_ids: z.array(id),
  })
  .strict();

export const priorityDecisionSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    opportunity_id: id,
    assessment_id: id,
    priority: prioritySchema,
    confidence: confidenceSchema,
    positive_factors: z.array(reasoningFactorSchema),
    negative_factors: z.array(reasoningFactorSchema),
    missing_evidence: z.array(z.unknown()),
    disqualifying_rules: z.array(z.string()),
    rule_version: z.string().min(1),
    calculated_at: dateTime,
    supersedes_priority_decision_id: nullableId,
  })
  .strict();

export const recommendationSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    opportunity_id: id,
    priority_decision_id: id,
    action_type: z.enum([
      "RESEARCH",
      "DEVELOP_ACCESS",
      "VALIDATE_PROBLEM",
      "REVIEW_OFFER",
      "PREPARE_OUTREACH",
      "MONITOR",
      "DEPRIORITIZE",
      "DISQUALIFY",
      "OTHER",
    ]),
    description: z.string().min(1),
    reason: z.string().min(1),
    supporting_evidence_ids: z.array(id),
    material_uncertainties: z.array(z.string()),
    confidence: confidenceSchema,
    requires_human_approval: z.literal(true),
    status: z.enum(recommendationStatuses),
    explanation_origin: z.enum(["DETERMINISTIC", "AI_ASSISTED"]),
    inference_id: nullableId,
    created_at: dateTime,
    expires_at: dateTime.nullable(),
  })
  .strict();

export const humanDecisionSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    opportunity_id: id,
    system_priority_decision_id: id,
    decision: z.enum(["ACCEPT", "REJECT", "DEFER", "OVERRIDE"]),
    previous_state: z.record(z.string(), z.unknown()),
    selected_state: z.record(z.string(), z.unknown()),
    reason: z.string().nullable(),
    supporting_evidence_ids: z.array(id),
    decided_by: id,
    decided_at: dateTime,
  })
  .strict()
  .superRefine((decision, context) => {
    if (decision.decision === "OVERRIDE" && !decision.reason?.trim())
      context.addIssue({
        code: "custom",
        message: "Override reason is required",
        path: ["reason"],
      });
  });

export const commercialOutcomeSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    opportunity_id: id,
    type: z.enum([
      "RESEARCH_COMPLETED",
      "ACCESS_PATH_FOUND",
      "OUTREACH_ATTEMPTED",
      "REPLY_RECEIVED",
      "MEETING_BOOKED",
      "MEETING_HELD",
      "OPPORTUNITY_VALIDATED",
      "PROPOSAL_CREATED",
      "PROPOSAL_SENT",
      "WON",
      "LOST",
      "NO_DECISION",
      "DISQUALIFIED",
    ]),
    occurred_at: dateTime,
    recorded_at: dateTime,
    recorded_by: id,
    details: z.record(z.string(), z.unknown()),
    evidence_ids: z.array(id),
    supersedes_outcome_id: nullableId,
  })
  .strict();

export const auditEventSchema = z
  .object({
    schema_version: schemaVersion,
    id,
    tenant_id: id,
    actor_id: id,
    action: z.string().min(1),
    resource_type: z.string().min(1),
    resource_id: id,
    occurred_at: dateTime,
    request_id: z.string().min(1),
    reason: z.string().nullable(),
    before: z.unknown().nullable(),
    after: z.unknown().nullable(),
    metadata: z.record(z.string(), z.unknown()),
  })
  .strict();

export const importResultSchema = z
  .object({
    schema_version: schemaVersion,
    import_id: id,
    status: z.enum([
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "COMPLETED_WITH_ERRORS",
      "FAILED",
    ]),
    row_count: z.number().int().nonnegative(),
    accepted_count: z.number().int().nonnegative(),
    rejected_count: z.number().int().nonnegative(),
    duplicate_candidate_count: z.number().int().nonnegative(),
    errors: z.array(
      z
        .object({
          row: z.number().int().positive(),
          field: z.string(),
          code: z.string(),
          message: z.string(),
        })
        .strict(),
    ),
    created_by: id,
    created_at: dateTime,
    completed_at: dateTime.nullable(),
  })
  .strict()
  .refine(
    (result) =>
      result.accepted_count + result.rejected_count === result.row_count,
    {
      message: "Accepted and rejected counts must equal row count",
    },
  );

export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          "VALIDATION_ERROR",
          "UNAUTHENTICATED",
          "FORBIDDEN",
          "NOT_FOUND",
          "CONFLICT",
          "RATE_LIMITED",
          "INTERNAL_ERROR",
        ]),
        message: z.string(),
        request_id: z.string(),
        details: z.array(z.unknown()),
      })
      .strict(),
  })
  .strict();
