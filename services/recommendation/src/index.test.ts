import { describe, expect, it } from "vitest";
import {
  explainRecommendation,
  recommendNextAction,
  buildApproachStrategy,
  type RecommendationInput,
} from "./index.js";
const base: RecommendationInput = {
  priority: "P1_PURSUE_NOW",
  confidence: "MEDIUM",
  missingEvidence: [],
  accessibility: "STRONG",
  problemEvidence: "STRONG",
  offerStatus: "APPROVED",
  factors: [
    {
      code: "PROBLEM_STRONG",
      description: "Problem is supported",
      evidenceIds: ["ev-1"],
    },
  ],
};
describe("recommendations", () => {
  it("proposes human-reviewable actions and never executes them", () => {
    expect(recommendNextAction(base)).toMatchObject({
      actionType: "PREPARE_OUTREACH",
      requiresHumanApproval: true,
      status: "PROPOSED",
    });
  });
  it("turns missing problem evidence into validation research", () => {
    expect(
      recommendNextAction({
        ...base,
        priority: "INSUFFICIENT_EVIDENCE",
        problemEvidence: "UNKNOWN",
        missingEvidence: ["problem"],
      }).actionType,
    ).toBe("VALIDATE_PROBLEM");
  });
  it("turns access weakness into access development", () => {
    expect(
      recommendNextAction({
        ...base,
        priority: "P3_MONITOR",
        accessibility: "WEAK",
      }).actionType,
    ).toBe("DEVELOP_ACCESS");
  });
  it("accepts only explanations grounded in actual factors and falls back safely", async () => {
    const action = recommendNextAction(base);
    const valid = await explainRecommendation(
      {
        name: "p",
        model: "m",
        async explain() {
          return {
            summary: "Supported explanation",
            factorCodes: ["PROBLEM_STRONG"],
          };
        },
      },
      base,
      action,
    );
    expect(valid).toMatchObject({
      origin: "AI_ASSISTED",
      factorCodes: ["PROBLEM_STRONG"],
    });
    const unsupported = await explainRecommendation(
      {
        name: "p",
        model: "m",
        async explain() {
          return { summary: "Invented", factorCodes: ["INVENTED_BUDGET"] };
        },
      },
      base,
      action,
    );
    expect(unsupported.origin).toBe("DETERMINISTIC");
    const failed = await explainRecommendation(
      {
        name: "p",
        model: "m",
        async explain() {
          throw new Error("outage");
        },
      },
      base,
      action,
    );
    expect(failed.origin).toBe("DETERMINISTIC");
  });
});

describe("approach strategy", () => {
  it("returns a research strategy when no reviewed problem is supported", () => {
    const strategy = buildApproachStrategy({
      organizationName: "Example Logistics",
      industry: "Trade and logistics",
      region: "Northern Virginia",
      observedNeeds: [],
      approvedOffers: [],
    });
    expect(strategy.recommendedOffer).toBe("No offer recommended yet");
    expect(strategy.evidenceGaps).toContain("Reviewed problem evidence");
  });

  it("maps reviewed evidence only to a matching approved offer", () => {
    const strategy = buildApproachStrategy({
      organizationName: "Example Logistics",
      industry: "Trade and logistics",
      region: "Northern Virginia",
      observedNeeds: [
        {
          statement: "Forecast accuracy is limiting capacity planning",
          evidenceIds: ["ev-1"],
          status: "REVIEWED",
        },
      ],
      approvedOffers: [
        {
          name: "Planning diagnostic",
          problemTags: ["forecast", "planning"],
          targetRoles: ["COO", "Head of Planning"],
        },
      ],
    });
    expect(strategy).toMatchObject({
      recommendedOffer: "Planning diagnostic",
      targetRoles: ["COO", "Head of Planning"],
      evidenceIds: ["ev-1"],
      requiresHumanApproval: true,
    });
  });
});
