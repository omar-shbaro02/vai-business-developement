export const PRIORITY_RULE_VERSION = "priority/0.1" as const;
export type Priority =
  | "P1_PURSUE_NOW"
  | "P2_DEVELOP"
  | "P3_MONITOR"
  | "P4_LOW_PRIORITY"
  | "INSUFFICIENT_EVIDENCE"
  | "DISQUALIFIED";
export type Rating =
  "STRONG" | "MODERATE" | "WEAK" | "UNKNOWN" | "NOT_APPLICABLE";
export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export interface PriorityFactor {
  code: string;
  description: string;
  evidenceIds: string[];
}
export interface PriorityInput {
  dimensions: {
    problem_evidence: Rating;
    buying_readiness: Rating;
    commercial_timing: Rating;
    accessibility: Rating;
    decision_maker_clarity: Rating;
    implementation_feasibility: Rating;
    expected_value: Rating;
    expected_effort: Rating;
    risk: Rating;
  };
  minimumEvidence: Record<
    "problem" | "timing_readiness" | "target_persona" | "access_route",
    { present: boolean; reviewed: boolean; evidenceIds: string[] }
  >;
  disqualifiers: Array<{
    code: string;
    description: string;
    verified: boolean;
    evidenceIds: string[];
  }>;
  dimensionFactors: Partial<
    Record<keyof PriorityInput["dimensions"], PriorityFactor[]>
  >;
  confidence: Confidence;
}
export interface PriorityResult {
  priority: Priority;
  confidence: Confidence;
  positiveFactors: PriorityFactor[];
  negativeFactors: PriorityFactor[];
  missingEvidence: string[];
  disqualifyingRules: string[];
  ruleVersion: typeof PRIORITY_RULE_VERSION;
  explanationCodes: string[];
}

export function calculatePriority(input: PriorityInput): PriorityResult {
  const verifiedDisqualifiers = input.disqualifiers.filter(
    (rule) => rule.verified,
  );
  if (verifiedDisqualifiers.length)
    return result(
      "DISQUALIFIED",
      input,
      [],
      verifiedDisqualifiers.map((rule) => ({
        code: rule.code,
        description: rule.description,
        evidenceIds: rule.evidenceIds,
      })),
      [],
      verifiedDisqualifiers.map((rule) => rule.code),
    );
  const missing = Object.entries(input.minimumEvidence)
    .filter(([, value]) => !value.present)
    .map(([category]) => category);
  if (missing.length)
    return result(
      "INSUFFICIENT_EVIDENCE",
      input,
      [],
      missing.map((category) => ({
        code: `MISSING_${category.toUpperCase()}`,
        description: `Missing ${category} evidence`,
        evidenceIds: [],
      })),
      missing,
      [],
    );
  const d = input.dimensions;
  const p1 =
    d.problem_evidence === "STRONG" &&
    (d.buying_readiness === "STRONG" || d.commercial_timing === "STRONG") &&
    atLeast(d.accessibility, "MODERATE") &&
    atLeast(d.decision_maker_clarity, "MODERATE") &&
    d.expected_value === "STRONG" &&
    d.implementation_feasibility !== "WEAK" &&
    d.risk !== "STRONG" &&
    Object.values(input.minimumEvidence).filter((item) => item.reviewed)
      .length >= 3;
  if (p1)
    return fromDimensions("P1_PURSUE_NOW", input, [
      "problem_evidence",
      "buying_readiness",
      "commercial_timing",
      "accessibility",
      "decision_maker_clarity",
      "expected_value",
    ]);
  const p2 =
    atLeast(d.problem_evidence, "MODERATE") &&
    (atLeast(d.buying_readiness, "MODERATE") ||
      atLeast(d.commercial_timing, "MODERATE")) &&
    atLeast(d.accessibility, "MODERATE") &&
    d.decision_maker_clarity !== "UNKNOWN";
  if (p2)
    return fromDimensions("P2_DEVELOP", input, [
      "problem_evidence",
      "buying_readiness",
      "commercial_timing",
      "accessibility",
      "decision_maker_clarity",
    ]);
  const p3 =
    atLeast(d.problem_evidence, "MODERATE") &&
    (d.buying_readiness === "WEAK" ||
      d.commercial_timing === "WEAK" ||
      d.accessibility === "WEAK");
  if (p3)
    return fromDimensions(
      "P3_MONITOR",
      input,
      ["problem_evidence"],
      ["buying_readiness", "commercial_timing", "accessibility"],
    );
  return fromDimensions(
    "P4_LOW_PRIORITY",
    input,
    [],
    ["expected_value", "implementation_feasibility", "expected_effort", "risk"],
  );
}

function fromDimensions(
  priority: Priority,
  input: PriorityInput,
  positiveKeys: Array<keyof PriorityInput["dimensions"]>,
  negativeKeys: Array<keyof PriorityInput["dimensions"]> = [],
) {
  const positive = positiveKeys.flatMap(
    (key) =>
      input.dimensionFactors[key] ?? [factor(key, input.dimensions[key])],
  );
  const negative = negativeKeys
    .filter((key) => ["WEAK", "STRONG"].includes(input.dimensions[key]))
    .flatMap(
      (key) =>
        input.dimensionFactors[key] ?? [factor(key, input.dimensions[key])],
    );
  return result(priority, input, positive, negative, [], []);
}
function result(
  priority: Priority,
  input: PriorityInput,
  positiveFactors: PriorityFactor[],
  negativeFactors: PriorityFactor[],
  missingEvidence: string[],
  disqualifyingRules: string[],
): PriorityResult {
  return {
    priority,
    confidence: input.confidence,
    positiveFactors,
    negativeFactors,
    missingEvidence,
    disqualifyingRules,
    ruleVersion: PRIORITY_RULE_VERSION,
    explanationCodes: [...positiveFactors, ...negativeFactors].map(
      (item) => item.code,
    ),
  };
}
function atLeast(value: Rating, minimum: "MODERATE") {
  return value === "STRONG" || value === minimum;
}
function factor(
  key: keyof PriorityInput["dimensions"],
  rating: Rating,
): PriorityFactor {
  return {
    code: `${key.toUpperCase()}_${rating}`,
    description: `${key} is ${rating.toLowerCase()}`,
    evidenceIds: [],
  };
}
