export const accountTiers = [
  "TIER_1",
  "TIER_2",
  "TIER_3",
  "UNCLASSIFIED",
] as const;
export type AccountTier = (typeof accountTiers)[number];

export const priorities = [
  "P1_PURSUE_NOW",
  "P2_DEVELOP",
  "P3_MONITOR",
  "P4_LOW_PRIORITY",
  "INSUFFICIENT_EVIDENCE",
  "DISQUALIFIED",
] as const;
export type Priority = (typeof priorities)[number];

export const confidences = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const;
export type Confidence = (typeof confidences)[number];

export const dimensionRatings = [
  "STRONG",
  "MODERATE",
  "WEAK",
  "UNKNOWN",
  "NOT_APPLICABLE",
] as const;
export type DimensionRating = (typeof dimensionRatings)[number];

export const freshnessValues = [
  "CURRENT",
  "AGING",
  "STALE",
  "UNKNOWN",
] as const;
export type Freshness = (typeof freshnessValues)[number];

export const verificationStatuses = [
  "RAW",
  "REVIEWED",
  "VERIFIED",
  "REJECTED",
] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const hypothesisStatuses = [
  "UNVERIFIED",
  "VALIDATED",
  "REJECTED",
] as const;
export type HypothesisStatus = (typeof hypothesisStatuses)[number];

export const opportunityStatuses = [
  "DRAFT",
  "ACTIVE",
  "ON_HOLD",
  "CLOSED",
] as const;
export type OpportunityStatus = (typeof opportunityStatuses)[number];

export const recommendationStatuses = [
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "SUPERSEDED",
] as const;
export type RecommendationStatus = (typeof recommendationStatuses)[number];

export type OpaqueId = string;
export type DateTime = string;
