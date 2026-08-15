import type {
  AccountTier,
  Confidence,
  DateTime,
  DimensionRating,
  Freshness,
  HypothesisStatus,
  OpaqueId,
  OpportunityStatus,
  Priority,
  RecommendationStatus,
  VerificationStatus,
} from "./values.js";

export interface Organization {
  id: OpaqueId;
  tenantId: OpaqueId;
  legalName: string;
  displayName: string;
  domains: readonly string[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface AccountProfile {
  organizationId: OpaqueId;
  tier: AccountTier;
  tierRuleVersion: string;
  evidenceIds: readonly OpaqueId[];
  reviewedAt: DateTime | null;
}

export interface EvidenceItem {
  id: OpaqueId;
  tenantId: OpaqueId;
  organizationId: OpaqueId;
  opportunityId: OpaqueId | null;
  sourceType: "MANUAL" | "CSV_IMPORT" | "APPROVED_CONNECTOR";
  sourceReference: string | null;
  capturedAt: DateTime;
  observedAt: DateTime | null;
  evidenceType: string;
  rawValue: unknown;
  confidence: Confidence;
  freshness: Freshness;
  verificationStatus: VerificationStatus;
  createdBy: OpaqueId;
}

export interface Signal {
  id: OpaqueId;
  organizationId: OpaqueId;
  opportunityId: OpaqueId | null;
  kind: "DETERMINISTIC_SIGNAL" | "AI_INFERENCE";
  type: string;
  value: unknown;
  evidenceIds: readonly OpaqueId[];
}

export interface ProblemHypothesis {
  id: OpaqueId;
  statement: string;
  status: HypothesisStatus;
  evidenceIds: readonly OpaqueId[];
  validatedBy: OpaqueId | null;
  validatedAt: DateTime | null;
}

export interface AccessPath {
  id: OpaqueId;
  type: string;
  strength: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  knownContactId: OpaqueId | null;
  evidenceIds: readonly OpaqueId[];
}

export interface AssessmentDimension {
  rating: DimensionRating;
  factorIds: readonly OpaqueId[];
  evidenceIds: readonly OpaqueId[];
}

export interface QualificationAssessment {
  id: OpaqueId;
  opportunityId: OpaqueId;
  dimensions: Readonly<Record<string, AssessmentDimension>>;
  confidence: Confidence;
  missingEvidence: readonly string[];
  ruleVersion: string;
  calculatedAt: DateTime;
}

export interface CommercialOpportunity {
  id: OpaqueId;
  tenantId: OpaqueId;
  organizationId: OpaqueId;
  title: string;
  status: OpportunityStatus;
  problemHypothesisId: OpaqueId;
  accessPathIds: readonly OpaqueId[];
  currentAssessmentId: OpaqueId | null;
  currentPriorityDecisionId: OpaqueId | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface PriorityDecision {
  id: OpaqueId;
  opportunityId: OpaqueId;
  assessmentId: OpaqueId;
  priority: Priority;
  confidence: Confidence;
  factorIds: readonly OpaqueId[];
  ruleVersion: string;
  calculatedAt: DateTime;
  supersedesPriorityDecisionId: OpaqueId | null;
}

export interface Recommendation {
  id: OpaqueId;
  opportunityId: OpaqueId;
  priorityDecisionId: OpaqueId;
  actionType: string;
  status: RecommendationStatus;
  requiresHumanApproval: true;
  supportingEvidenceIds: readonly OpaqueId[];
  createdAt: DateTime;
}

export interface HumanDecision {
  id: OpaqueId;
  opportunityId: OpaqueId;
  systemPriorityDecisionId: OpaqueId;
  decision: "ACCEPT" | "REJECT" | "DEFER" | "OVERRIDE";
  reason: string | null;
  decidedBy: OpaqueId;
  decidedAt: DateTime;
}

export interface CommercialOutcome {
  id: OpaqueId;
  opportunityId: OpaqueId;
  type: string;
  occurredAt: DateTime;
  recordedAt: DateTime;
  recordedBy: OpaqueId;
  supersedesOutcomeId: OpaqueId | null;
}

export function assertOpportunityRelationships(
  input: CommercialOpportunity,
): void {
  if (input.organizationId.length === 0)
    throw new Error("Opportunity requires an organization");
  if (input.problemHypothesisId.length === 0)
    throw new Error("Opportunity requires one problem hypothesis");
  if (new Set(input.accessPathIds).size !== input.accessPathIds.length)
    throw new Error("Access paths must be unique");
}
