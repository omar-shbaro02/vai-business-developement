import { describe, expect, it } from "vitest";
import { recommendAccountTier, type TierRating } from "./account-tier.js";

const dimension = (rating: TierRating, id: string) => ({
  rating,
  evidenceIds: [id],
});

describe("account tier recommendation", () => {
  it("keeps accounts unclassified when material evidence is unknown", () => {
    const result = recommendAccountTier({
      commercialValue: dimension("HIGH", "ev-1"),
      multiUnitLeverage: dimension("UNKNOWN", "ev-2"),
      referenceValue: dimension("LOW", "ev-3"),
      scope: dimension("MODERATE", "ev-4"),
    });
    expect(result.tier).toBe("UNCLASSIFIED");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("recommends Tier 1 for multiple high-value dimensions", () => {
    const result = recommendAccountTier({
      commercialValue: dimension("HIGH", "ev-1"),
      multiUnitLeverage: dimension("HIGH", "ev-2"),
      referenceValue: dimension("MODERATE", "ev-3"),
      scope: dimension("MODERATE", "ev-4"),
    });
    expect(result).toMatchObject({
      tier: "TIER_1",
      ruleVersion: "account-tier/draft-0.1",
    });
    expect(result.evidenceIds).toHaveLength(4);
  });

  it("recommends Tier 2 for meaningful strategic relevance", () => {
    expect(
      recommendAccountTier({
        commercialValue: dimension("MODERATE", "ev-1"),
        multiUnitLeverage: dimension("MODERATE", "ev-2"),
        referenceValue: dimension("LOW", "ev-3"),
        scope: dimension("LOW", "ev-4"),
      }).tier,
    ).toBe("TIER_2");
  });

  it("recommends Tier 3 for a reviewed narrowly scoped account", () => {
    expect(
      recommendAccountTier({
        commercialValue: dimension("LOW", "ev-1"),
        multiUnitLeverage: dimension("LOW", "ev-2"),
        referenceValue: dimension("LOW", "ev-3"),
        scope: dimension("LOW", "ev-4"),
      }).tier,
    ).toBe("TIER_3");
  });
});
