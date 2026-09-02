import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const confidenceEnum = pgEnum("confidence", [
  "HIGH",
  "MEDIUM",
  "LOW",
  "UNKNOWN",
]);
export const freshnessEnum = pgEnum("freshness", [
  "CURRENT",
  "AGING",
  "STALE",
  "UNKNOWN",
]);
export const verificationEnum = pgEnum("verification_status", [
  "RAW",
  "REVIEWED",
  "VERIFIED",
  "REJECTED",
]);
export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "DRAFT",
  "ACTIVE",
  "ON_HOLD",
  "CLOSED",
]);
export const priorityEnum = pgEnum("priority", [
  "P1_PURSUE_NOW",
  "P2_DEVELOP",
  "P3_MONITOR",
  "P4_LOW_PRIORITY",
  "INSUFFICIENT_EVIDENCE",
  "DISQUALIFIED",
]);
export const mergeCandidateStatusEnum = pgEnum("merge_candidate_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "DEAD_LETTER",
]);
export const importStatusEnum = pgEnum("import_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
]);
export const offerMappingStatusEnum = pgEnum("offer_mapping_status", [
  "HYPOTHESIS",
  "REVIEWED",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
});

export const actors = pgTable(
  "actors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    externalSubject: text("external_subject").notNull(),
    displayName: text("display_name").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("actors_tenant_subject_uidx").on(t.tenantId, t.externalSubject),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    legalName: text("legal_name").notNull(),
    displayName: text("display_name").notNull(),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference"),
    sourceRecordId: text("source_record_id"),
    importId: uuid("import_id"),
    mergedIntoId: uuid("merged_into_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    ...timestamps,
  },
  (t) => [
    index("organizations_tenant_name_idx").on(t.tenantId, t.displayName),
    index("organizations_source_idx").on(
      t.tenantId,
      t.sourceType,
      t.sourceReference,
    ),
  ],
);

export const organizationAliases = pgTable(
  "organization_aliases",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    canonicalOrganizationId: uuid("canonical_organization_id")
      .notNull()
      .references(() => organizations.id),
    aliasOrganizationId: uuid("alias_organization_id")
      .notNull()
      .references(() => organizations.id),
    mergeEventId: uuid("merge_event_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tenantId, t.aliasOrganizationId] }),
    index("organization_aliases_canonical_idx").on(
      t.tenantId,
      t.canonicalOrganizationId,
    ),
    check(
      "organization_alias_not_self_check",
      sql`${t.canonicalOrganizationId} <> ${t.aliasOrganizationId}`,
    ),
  ],
);

export const organizationMergeCandidates = pgTable(
  "organization_merge_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    sourceOrganizationId: uuid("source_organization_id")
      .notNull()
      .references(() => organizations.id),
    targetOrganizationId: uuid("target_organization_id")
      .notNull()
      .references(() => organizations.id),
    score: text("score").notNull(),
    reasons: jsonb("reasons").$type<string[]>().notNull(),
    status: mergeCandidateStatusEnum("status").default("PENDING").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedBy: uuid("reviewed_by").references(() => actors.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewReason: text("review_reason"),
  },
  (t) => [
    uniqueIndex("merge_candidates_pair_pending_uidx").on(
      t.tenantId,
      t.sourceOrganizationId,
      t.targetOrganizationId,
      t.status,
    ),
    index("merge_candidates_tenant_status_idx").on(
      t.tenantId,
      t.status,
      t.detectedAt,
    ),
    check(
      "merge_candidate_not_self_check",
      sql`${t.sourceOrganizationId} <> ${t.targetOrganizationId}`,
    ),
  ],
);

export const organizationMergeEvents = pgTable(
  "organization_merge_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => organizationMergeCandidates.id),
    canonicalOrganizationId: uuid("canonical_organization_id")
      .notNull()
      .references(() => organizations.id),
    aliasOrganizationId: uuid("alias_organization_id")
      .notNull()
      .references(() => organizations.id),
    movedRelationships: jsonb("moved_relationships")
      .$type<Record<string, string[]>>()
      .notNull(),
    approvedBy: uuid("approved_by")
      .notNull()
      .references(() => actors.id),
    approvedAt: timestamp("approved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reason: text("reason").notNull(),
    reversedBy: uuid("reversed_by").references(() => actors.id),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversalReason: text("reversal_reason"),
  },
  (t) => [
    index("merge_events_alias_idx").on(
      t.tenantId,
      t.aliasOrganizationId,
      t.approvedAt,
    ),
  ],
);

export const organizationDomains = pgTable(
  "organization_domains",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    domain: text("domain").notNull(),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.domain] }),
    uniqueIndex("organization_domains_tenant_domain_uidx").on(
      t.tenantId,
      t.domain,
    ),
  ],
);

export const accountProfiles = pgTable(
  "account_profiles",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    tier: text("tier").notNull(),
    tierRuleVersion: text("tier_rule_version").notNull(),
    website: text("website"),
    locations: jsonb("locations")
      .$type<
        Array<{
          country: string | null;
          region: string | null;
          locality: string | null;
        }>
      >()
      .default([])
      .notNull(),
    industryCode: text("industry_code"),
    industryLabel: text("industry_label"),
    industryEvidenceIds: jsonb("industry_evidence_ids")
      .$type<string[]>()
      .default([])
      .notNull(),
    sizeContext: jsonb("size_context"),
    context: jsonb("context").default({}).notNull(),
    freshness: freshnessEnum("freshness").default("UNKNOWN").notNull(),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("account_profiles_tenant_tier_idx").on(t.tenantId, t.tier)],
);

export const problemHypotheses = pgTable("problem_hypotheses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  opportunityId: uuid("opportunity_id"),
  statement: text("statement").notNull(),
  status: text("status").notNull(),
  evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
  validatedBy: uuid("validated_by").references(() => actors.id),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => actors.id),
  supersedesHypothesisId: uuid("supersedes_hypothesis_id"),
  ...timestamps,
});

export const opportunities = pgTable(
  "commercial_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: text("title").notNull(),
    status: opportunityStatusEnum("status").notNull(),
    closureReason: text("closure_reason"),
    holdReason: text("hold_reason"),
    reviewAt: timestamp("review_at", { withTimezone: true }),
    problemHypothesisId: uuid("problem_hypothesis_id")
      .notNull()
      .references(() => problemHypotheses.id),
    currentAssessmentId: uuid("current_assessment_id"),
    currentPriorityDecisionId: uuid("current_priority_decision_id"),
    targetPersona: jsonb("target_persona")
      .default({ role: null, known_contact_id: null, evidence_ids: [] })
      .notNull(),
    currentOfferMappingId: uuid("current_offer_mapping_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    ...timestamps,
  },
  (t) => [
    index("opportunities_tenant_status_idx").on(t.tenantId, t.status),
    index("opportunities_organization_idx").on(t.tenantId, t.organizationId),
  ],
);

export const opportunityVersions = pgTable(
  "opportunity_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    version: integer("version").notNull(),
    state: jsonb("state").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    reason: text("reason").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("opportunity_versions_number_uidx").on(
      t.tenantId,
      t.opportunityId,
      t.version,
    ),
  ],
);

export const offerMappings = pgTable(
  "offer_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    offerId: text("offer_id").notNull(),
    label: text("label").notNull(),
    status: offerMappingStatusEnum("status").default("HYPOTHESIS").notNull(),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
    explanation: text("explanation").notNull(),
    origin: text("origin").notNull(),
    inferenceId: uuid("inference_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    reviewedBy: uuid("reviewed_by").references(() => actors.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewReason: text("review_reason"),
    supersedesMappingId: uuid("supersedes_mapping_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("offer_mappings_opportunity_status_idx").on(
      t.tenantId,
      t.opportunityId,
      t.status,
    ),
  ],
);

export const evidenceItems = pgTable(
  "evidence_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference"),
    sourceRecordId: text("source_record_id"),
    importId: uuid("import_id"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    evidenceType: text("evidence_type").notNull(),
    rawValue: jsonb("raw_value").notNull(),
    normalizedValue: jsonb("normalized_value"),
    confidence: confidenceEnum("confidence").notNull(),
    freshness: freshnessEnum("freshness").notNull(),
    verificationStatus: verificationEnum("verification_status").notNull(),
    reviewNotes: text("review_notes"),
    supersedesEvidenceId: uuid("supersedes_evidence_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    ...timestamps,
  },
  (t) => [
    index("evidence_org_captured_idx").on(
      t.tenantId,
      t.organizationId,
      t.capturedAt,
    ),
    index("evidence_opportunity_idx").on(t.tenantId, t.opportunityId),
    index("evidence_source_idx").on(
      t.tenantId,
      t.sourceType,
      t.sourceReference,
    ),
  ],
);

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id),
    kind: text("kind").notNull(),
    type: text("type").notNull(),
    value: jsonb("value").notNull(),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
    modelMetadata: jsonb("model_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("signals_org_kind_idx").on(t.tenantId, t.organizationId, t.kind),
  ],
);

export const accessPaths = pgTable(
  "access_paths",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    type: text("type").notNull(),
    strength: confidenceEnum("strength").notNull(),
    knownContactId: uuid("known_contact_id"),
    evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
    ...timestamps,
  },
  (t) => [
    index("access_paths_opportunity_idx").on(t.tenantId, t.opportunityId),
  ],
);

export const qualificationAssessments = pgTable(
  "qualification_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    dimensions: jsonb("dimensions").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    confidenceFactors: jsonb("confidence_factors").default([]).notNull(),
    missingEvidence: jsonb("missing_evidence").default([]).notNull(),
    ruleVersion: text("rule_version").notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull(),
    supersedesAssessmentId: uuid("supersedes_assessment_id"),
  },
  (t) => [
    index("assessments_opportunity_time_idx").on(
      t.tenantId,
      t.opportunityId,
      t.calculatedAt,
    ),
  ],
);

export const priorityDecisions = pgTable(
  "priority_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => qualificationAssessments.id),
    priority: priorityEnum("priority").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    factorIds: jsonb("factor_ids").$type<string[]>().default([]).notNull(),
    positiveFactors: jsonb("positive_factors").default([]).notNull(),
    negativeFactors: jsonb("negative_factors").default([]).notNull(),
    missingEvidence: jsonb("missing_evidence").default([]).notNull(),
    disqualifyingRules: jsonb("disqualifying_rules").default([]).notNull(),
    ruleVersion: text("rule_version").notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull(),
    supersedesPriorityDecisionId: uuid("supersedes_priority_decision_id"),
  },
  (t) => [
    index("priority_decisions_opportunity_time_idx").on(
      t.tenantId,
      t.opportunityId,
      t.calculatedAt,
    ),
  ],
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    priorityDecisionId: uuid("priority_decision_id")
      .notNull()
      .references(() => priorityDecisions.id),
    actionType: text("action_type").notNull(),
    description: text("description").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull(),
    requiresHumanApproval: boolean("requires_human_approval")
      .default(true)
      .notNull(),
    supportingEvidenceIds: jsonb("supporting_evidence_ids")
      .$type<string[]>()
      .default([])
      .notNull(),
    materialUncertainties: jsonb("material_uncertainties")
      .default([])
      .notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    explanationOrigin: text("explanation_origin").notNull(),
    inferenceId: uuid("inference_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    index("recommendations_opportunity_status_idx").on(
      t.tenantId,
      t.opportunityId,
      t.status,
    ),
    check(
      "recommendations_human_approval_check",
      sql`${t.requiresHumanApproval} = true`,
    ),
  ],
);

export const humanDecisions = pgTable(
  "human_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    systemPriorityDecisionId: uuid("system_priority_decision_id")
      .notNull()
      .references(() => priorityDecisions.id),
    decision: text("decision").notNull(),
    previousState: jsonb("previous_state").notNull(),
    selectedState: jsonb("selected_state").notNull(),
    reason: text("reason"),
    supportingEvidenceIds: jsonb("supporting_evidence_ids")
      .$type<string[]>()
      .default([])
      .notNull(),
    decidedBy: uuid("decided_by")
      .notNull()
      .references(() => actors.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("human_decisions_opportunity_time_idx").on(
      t.tenantId,
      t.opportunityId,
      t.decidedAt,
    ),
  ],
);

export const commercialOutcomes = pgTable(
  "commercial_outcomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => actors.id),
    supersedesOutcomeId: uuid("supersedes_outcome_id"),
  },
  (t) => [
    index("outcomes_opportunity_time_idx").on(
      t.tenantId,
      t.opportunityId,
      t.occurredAt,
    ),
  ],
);

export const ruleVersions = pgTable(
  "rule_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    ruleType: text("rule_type").notNull(),
    version: text("version").notNull(),
    definition: jsonb("definition").notNull(),
    definitionHash: text("definition_hash").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("rule_versions_tenant_type_version_uidx").on(
      t.tenantId,
      t.ruleType,
      t.version,
    ),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    requestId: text("request_id").notNull(),
    reason: text("reason"),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata").default({}).notNull(),
  },
  (t) => [
    index("audit_resource_time_idx").on(
      t.tenantId,
      t.resourceType,
      t.resourceId,
      t.occurredAt,
    ),
    index("audit_actor_time_idx").on(t.tenantId, t.actorId, t.occurredAt),
    index("audit_request_idx").on(t.tenantId, t.requestId),
  ],
);

export const backgroundJobs = pgTable(
  "background_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: jobStatusEnum("status").default("PENDING").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    availableAt: timestamp("available_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("background_jobs_tenant_idempotency_uidx").on(
      t.tenantId,
      t.idempotencyKey,
    ),
    index("background_jobs_claim_idx").on(t.status, t.availableAt, t.createdAt),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    topic: text("topic").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    payload: jsonb("payload").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("outbox_tenant_idempotency_uidx").on(
      t.tenantId,
      t.idempotencyKey,
    ),
    index("outbox_unpublished_idx").on(t.publishedAt, t.createdAt),
  ],
);

export const discoveryImports = pgTable(
  "discovery_imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    status: importStatusEnum("status").default("PENDING").notNull(),
    filename: text("filename").notNull(),
    sourceReference: text("source_reference").notNull(),
    rawStorageReference: text("raw_storage_reference"),
    cleanupAfter: timestamp("cleanup_after", { withTimezone: true }),
    permissionAttested: boolean("permission_attested").notNull(),
    attestationText: text("attestation_text").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
    rowCount: integer("row_count").default(0).notNull(),
    acceptedCount: integer("accepted_count").default(0).notNull(),
    rejectedCount: integer("rejected_count").default(0).notNull(),
    duplicateCandidateCount: integer("duplicate_candidate_count")
      .default(0)
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("discovery_imports_tenant_status_idx").on(
      t.tenantId,
      t.status,
      t.createdAt,
    ),
    check(
      "import_permission_attested_check",
      sql`${t.permissionAttested} = true`,
    ),
  ],
);

export const discoveryImportErrors = pgTable(
  "discovery_import_errors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importId: uuid("import_id")
      .notNull()
      .references(() => discoveryImports.id),
    rowNumber: integer("row_number").notNull(),
    field: text("field"),
    code: text("code").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("import_errors_import_row_idx").on(t.importId, t.rowNumber)],
);

export const discoveryRecords = pgTable(
  "discovery_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    importId: uuid("import_id").references(() => discoveryImports.id),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceRecordId: text("source_record_id").notNull(),
    legalName: text("legal_name").notNull(),
    displayName: text("display_name").notNull(),
    website: text("website"),
    domain: text("domain"),
    rawRecord: jsonb("raw_record"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => actors.id),
  },
  (t) => [
    uniqueIndex("discovery_records_source_uidx").on(
      t.tenantId,
      t.sourceType,
      t.sourceReference,
      t.sourceRecordId,
    ),
    index("discovery_records_domain_idx").on(t.tenantId, t.domain),
  ],
);

export const lifecycleTransitions = pgTable(
  "lifecycle_transitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fromState: text("from_state").notNull(),
    toState: text("to_state").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id),
    reason: text("reason").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    supersedesTransitionId: uuid("supersedes_transition_id"),
  },
  (t) => [
    index("lifecycle_entity_time_idx").on(
      t.tenantId,
      t.entityType,
      t.entityId,
      t.occurredAt,
    ),
  ],
);
