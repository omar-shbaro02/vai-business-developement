export const dimensionNames = [
  "strategic_attractiveness",
  "problem_evidence",
  "buying_readiness",
  "commercial_timing",
  "accessibility",
  "decision_maker_clarity",
  "budget_plausibility",
  "implementation_feasibility",
  "expected_value",
  "expected_effort",
  "risk",
] as const;
export type DimensionName = (typeof dimensionNames)[number];
export type DimensionRating =
  "STRONG" | "MODERATE" | "WEAK" | "UNKNOWN" | "NOT_APPLICABLE";
export interface DimensionFactor {
  id: string;
  code: string;
  description: string;
  rating: Exclude<DimensionRating, "UNKNOWN">;
  evidenceIds: string[];
}
export interface DimensionResult {
  rating: DimensionRating;
  factorIds: string[];
  evidenceIds: string[];
}
export interface MissingEvidence {
  category: DimensionName;
  description: string;
  material: true;
}
export type DimensionEvaluator<Context> = (
  context: Context,
) => DimensionFactor[];

export function evaluateQualification<Context>(
  context: Context,
  evaluators: Readonly<
    Partial<Record<DimensionName, DimensionEvaluator<Context>>>
  >,
) {
  const dimensions = {} as Record<DimensionName, DimensionResult>;
  const missingEvidence: MissingEvidence[] = [];
  for (const name of dimensionNames) {
    const factors = evaluators[name]?.(context) ?? [];
    const supported = factors.filter(
      (factor) =>
        factor.evidenceIds.length > 0 || factor.rating === "NOT_APPLICABLE",
    );
    dimensions[name] =
      supported.length === 0
        ? { rating: "UNKNOWN", factorIds: [], evidenceIds: [] }
        : {
            rating: conservativeRating(
              supported.map((factor) => factor.rating),
            ),
            factorIds: supported.map((factor) => factor.id),
            evidenceIds: [
              ...new Set(supported.flatMap((factor) => factor.evidenceIds)),
            ],
          };
    if (dimensions[name].rating === "UNKNOWN")
      missingEvidence.push({
        category: name,
        description: `Evidence required for ${name}`,
        material: true,
      });
  }
  return {
    dimensions,
    missingEvidence,
    ruleVersion: "qualification/0.1" as const,
  };
}

export interface AccessInput {
  type:
    | "REFERRAL"
    | "MUTUAL_CONNECTION"
    | "EXISTING_RELATIONSHIP"
    | "EVENT"
    | "ASSOCIATION"
    | "PARTNER"
    | "INBOUND"
    | "COLD_ROUTE"
    | "OTHER"
    | "UNKNOWN";
  knownContactId: string | null;
  evidence: Array<{
    id: string;
    verificationStatus: "RAW" | "REVIEWED" | "VERIFIED" | "REJECTED";
    freshness: "CURRENT" | "AGING" | "STALE" | "UNKNOWN";
  }>;
}
export interface AccessAssessment {
  strength: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  factorCodes: string[];
  evidenceIds: string[];
}

export function assessAccessPath(input: AccessInput): AccessAssessment {
  const usable = input.evidence.filter(
    (item) =>
      item.verificationStatus !== "REJECTED" && item.freshness !== "STALE",
  );
  if (usable.length === 0)
    return input.knownContactId
      ? { strength: "LOW", factorCodes: ["CONTACT_ONLY"], evidenceIds: [] }
      : {
          strength: "UNKNOWN",
          factorCodes: ["NO_ACCESS_EVIDENCE"],
          evidenceIds: [],
        };
  const verified = usable.some(
    (item) => item.verificationStatus === "VERIFIED",
  );
  const warm = [
    "REFERRAL",
    "EXISTING_RELATIONSHIP",
    "PARTNER",
    "INBOUND",
  ].includes(input.type);
  const strength =
    verified && warm
      ? "HIGH"
      : warm || input.type === "MUTUAL_CONNECTION"
        ? "MEDIUM"
        : "LOW";
  return {
    strength,
    factorCodes: [
      verified ? "VERIFIED_ACCESS" : "REVIEWED_ACCESS",
      `ROUTE_${input.type}`,
    ],
    evidenceIds: usable.map((item) => item.id),
  };
}

export interface ConfidenceEvidence {
  id: string;
  category: string;
  verificationStatus: "RAW" | "REVIEWED" | "VERIFIED" | "REJECTED";
  freshness: "CURRENT" | "AGING" | "STALE" | "UNKNOWN";
  sourceQuality: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
}
export interface ConfidenceResult {
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  factors: Array<{
    code: string;
    value: number | string;
    evidenceIds: string[];
  }>;
  missingCategories: string[];
  ruleVersion: "confidence/0.1";
}

export function calculateEvidenceConfidence(
  requiredCategories: readonly string[],
  evidence: readonly ConfidenceEvidence[],
): ConfidenceResult {
  const usable = evidence.filter(
    (item) => item.verificationStatus !== "REJECTED",
  );
  const covered = new Set(usable.map((item) => item.category));
  const missingCategories = requiredCategories.filter(
    (category) => !covered.has(category),
  );
  const coverage =
    requiredCategories.length === 0
      ? 1
      : (requiredCategories.length - missingCategories.length) /
        requiredCategories.length;
  const stale = usable.filter((item) => item.freshness === "STALE").length;
  const verified = usable.filter(
    (item) => item.verificationStatus === "VERIFIED",
  ).length;
  const highQuality = usable.filter(
    (item) => item.sourceQuality === "HIGH",
  ).length;
  let confidence: ConfidenceResult["confidence"];
  if (usable.length === 0) confidence = "UNKNOWN";
  else if (coverage < 0.5 || stale / usable.length > 0.5 || verified === 0)
    confidence = "LOW";
  else if (
    coverage === 1 &&
    stale === 0 &&
    verified === usable.length &&
    highQuality === usable.length
  )
    confidence = "HIGH";
  else confidence = "MEDIUM";
  return {
    confidence,
    missingCategories,
    ruleVersion: "confidence/0.1",
    factors: [
      {
        code: "EVIDENCE_COVERAGE",
        value: coverage,
        evidenceIds: usable.map((item) => item.id),
      },
      {
        code: "VERIFIED_EVIDENCE_COUNT",
        value: verified,
        evidenceIds: usable
          .filter((item) => item.verificationStatus === "VERIFIED")
          .map((item) => item.id),
      },
      {
        code: "STALE_EVIDENCE_COUNT",
        value: stale,
        evidenceIds: usable
          .filter((item) => item.freshness === "STALE")
          .map((item) => item.id),
      },
    ],
  };
}

function conservativeRating(
  ratings: Array<Exclude<DimensionRating, "UNKNOWN">>,
): DimensionRating {
  if (ratings.every((rating) => rating === "NOT_APPLICABLE"))
    return "NOT_APPLICABLE";
  const applicable = ratings.filter((rating) => rating !== "NOT_APPLICABLE");
  if (applicable.includes("WEAK")) return "WEAK";
  if (applicable.includes("MODERATE")) return "MODERATE";
  return "STRONG";
}
