import { describe, expect, it } from "vitest";
import {
  assessAccessPath,
  calculateEvidenceConfidence,
  evaluateQualification,
} from "./index.js";

describe("qualification", () => {
  it("evaluates dimensions independently and exposes missing evidence", () => {
    const result = evaluateQualification(
      { problemEvidenceId: "ev-problem" },
      {
        problem_evidence: (context) => [
          {
            id: "factor-problem",
            code: "VERIFIED_PROBLEM",
            description: "Problem is verified",
            rating: "STRONG",
            evidenceIds: [context.problemEvidenceId],
          },
        ],
        expected_value: () => [
          {
            id: "unsupported",
            code: "NO_EVIDENCE",
            description: "unsupported",
            rating: "STRONG",
            evidenceIds: [],
          },
        ],
      },
    );
    expect(result.dimensions.problem_evidence).toEqual({
      rating: "STRONG",
      factorIds: ["factor-problem"],
      evidenceIds: ["ev-problem"],
    });
    expect(result.dimensions.expected_value.rating).toBe("UNKNOWN");
    expect(result.missingEvidence).toContainEqual(
      expect.objectContaining({ category: "expected_value", material: true }),
    );
  });
  it("does not turn contact availability into strong or medium access", () => {
    expect(
      assessAccessPath({
        type: "COLD_ROUTE",
        knownContactId: "contact",
        evidence: [],
      }),
    ).toEqual({
      strength: "LOW",
      factorCodes: ["CONTACT_ONLY"],
      evidenceIds: [],
    });
    expect(
      assessAccessPath({ type: "UNKNOWN", knownContactId: null, evidence: [] })
        .strength,
    ).toBe("UNKNOWN");
    expect(
      assessAccessPath({
        type: "REFERRAL",
        knownContactId: "contact",
        evidence: [
          {
            id: "ev-access",
            verificationStatus: "VERIFIED",
            freshness: "CURRENT",
          },
        ],
      }).strength,
    ).toBe("HIGH");
  });
  it.each([
    {
      name: "complete verified current evidence",
      evidence: [fact("problem"), fact("access")],
      expected: "HIGH",
    },
    {
      name: "missing material category",
      evidence: [fact("problem")],
      expected: "MEDIUM",
    },
    {
      name: "mostly stale evidence",
      evidence: [fact("problem", "STALE"), fact("access", "STALE")],
      expected: "LOW",
    },
    { name: "no evidence", evidence: [], expected: "UNKNOWN" },
  ])("regresses confidence for $name", ({ evidence, expected }) => {
    expect(
      calculateEvidenceConfidence(["problem", "access"], evidence).confidence,
    ).toBe(expected);
  });
  it("has no attractiveness input and reports only evidence-quality factors", () => {
    const result = calculateEvidenceConfidence(["problem"], [fact("problem")]);
    expect(result.factors.map((factor) => factor.code)).toEqual([
      "EVIDENCE_COVERAGE",
      "VERIFIED_EVIDENCE_COUNT",
      "STALE_EVIDENCE_COUNT",
    ]);
  });
});
function fact(category: string, freshness: "CURRENT" | "STALE" = "CURRENT") {
  return {
    id: `ev-${category}`,
    category,
    verificationStatus: "VERIFIED" as const,
    freshness,
    sourceQuality: "HIGH" as const,
  };
}
