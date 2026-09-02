import { describe, expect, it } from "vitest";
import {
  calculatePriority,
  type Priority,
  type PriorityInput,
  type Rating,
} from "./index.js";

const expectedFixtures: Array<[string, PriorityInput, Priority]> = [
  [
    "attractive Tier 1 but inaccessible",
    input({ accessibility: "WEAK", buying_readiness: "WEAK" }, "HIGH"),
    "P3_MONITOR",
  ],
  [
    "smaller Tier 3 with strong immediate opportunity",
    input({}, "HIGH"),
    "P1_PURSUE_NOW",
  ],
  ["P1 with low confidence", input({}, "LOW"), "P1_PURSUE_NOW"],
  [
    "high confidence but low priority",
    input(
      {
        problem_evidence: "WEAK",
        expected_value: "WEAK",
        implementation_feasibility: "WEAK",
        expected_effort: "STRONG",
      },
      "HIGH",
    ),
    "P4_LOW_PRIORITY",
  ],
  [
    "insufficient evidence",
    input({}, "LOW", { access_route: false }),
    "INSUFFICIENT_EVIDENCE",
  ],
  [
    "disqualified",
    {
      ...input({}, "HIGH"),
      disqualifiers: [
        {
          code: "PROHIBITED_SECTOR",
          description: "Sector is prohibited",
          verified: true,
          evidenceIds: ["ev-disqualifier"],
        },
      ],
    },
    "DISQUALIFIED",
  ],
  [
    "conflicting evidence",
    input(
      {
        problem_evidence: "MODERATE",
        buying_readiness: "MODERATE",
        commercial_timing: "WEAK",
        accessibility: "MODERATE",
      },
      "MEDIUM",
    ),
    "P2_DEVELOP",
  ],
  [
    "stale evidence",
    input({ buying_readiness: "WEAK", commercial_timing: "WEAK" }, "LOW"),
    "P3_MONITOR",
  ],
];

describe("priority/0.1", () => {
  it.each(expectedFixtures)(
    "matches approved fixture: %s",
    (_name, value, expected) => {
      expect(calculatePriority(value).priority).toBe(expected);
    },
  );
  it("is deterministic and keeps confidence separate", () => {
    const value = input({}, "LOW");
    expect(calculatePriority(value)).toEqual(
      calculatePriority(JSON.parse(JSON.stringify(value)) as PriorityInput),
    );
    expect(calculatePriority(value)).toMatchObject({
      priority: "P1_PURSUE_NOW",
      confidence: "LOW",
      ruleVersion: "priority/0.1",
    });
  });
  it("ignores account tier and derives explanations only from returned factors", () => {
    const value = { ...input({}, "HIGH"), accountTier: "TIER_1" };
    const other = { ...value, accountTier: "TIER_3" };
    const first = calculatePriority(value),
      second = calculatePriority(other);
    expect(first.priority).toBe(second.priority);
    expect(first.explanationCodes).toEqual(
      [...first.positiveFactors, ...first.negativeFactors].map(
        (factor) => factor.code,
      ),
    );
  });
});

function input(
  overrides: Partial<PriorityInput["dimensions"]> = {},
  confidence: PriorityInput["confidence"] = "HIGH",
  presence: Partial<
    Record<keyof PriorityInput["minimumEvidence"], boolean>
  > = {},
): PriorityInput {
  const dimensions = {
    problem_evidence: "STRONG",
    buying_readiness: "STRONG",
    commercial_timing: "STRONG",
    accessibility: "STRONG",
    decision_maker_clarity: "STRONG",
    implementation_feasibility: "MODERATE",
    expected_value: "STRONG",
    expected_effort: "MODERATE",
    risk: "MODERATE",
    ...overrides,
  } as Record<keyof PriorityInput["dimensions"], Rating>;
  const minimumEvidence = Object.fromEntries(
    (
      ["problem", "timing_readiness", "target_persona", "access_route"] as const
    ).map((category) => [
      category,
      {
        present: presence[category] ?? true,
        reviewed: true,
        evidenceIds: [`ev-${category}`],
      },
    ]),
  ) as PriorityInput["minimumEvidence"];
  return {
    dimensions,
    minimumEvidence,
    disqualifiers: [],
    dimensionFactors: {},
    confidence,
  };
}
