import type { AccountTier } from "./values.js";

export type TierRating = "HIGH" | "MODERATE" | "LOW" | "UNKNOWN";

export interface TierDimension {
  rating: TierRating;
  evidenceIds: readonly string[];
}

export interface AccountTierInput {
  commercialValue: TierDimension;
  multiUnitLeverage: TierDimension;
  referenceValue: TierDimension;
  scope: TierDimension;
}

export interface AccountTierRecommendation {
  tier: AccountTier;
  ruleVersion: "account-tier/draft-0.1";
  reasons: string[];
  evidenceIds: string[];
  requiresHumanReview: true;
}

export function recommendAccountTier(
  input: AccountTierInput,
): AccountTierRecommendation {
  const dimensions = Object.entries(input) as Array<
    [keyof AccountTierInput, TierDimension]
  >;
  const evidenceIds = [
    ...new Set(dimensions.flatMap(([, value]) => value.evidenceIds)),
  ];
  const unsupported = dimensions.filter(
    ([, value]) => value.rating === "UNKNOWN" || value.evidenceIds.length === 0,
  );
  if (unsupported.length > 0)
    return result(
      "UNCLASSIFIED",
      [
        `Insufficient reviewed evidence for: ${unsupported
          .map(([name]) => label(name))
          .join(", ")}`,
      ],
      evidenceIds,
    );

  const high = dimensions.filter(([, value]) => value.rating === "HIGH"),
    moderate = dimensions.filter(([, value]) => value.rating === "MODERATE"),
    exceptionalReference = input.referenceValue.rating === "HIGH";
  if (high.length >= 2 || exceptionalReference)
    return result(
      "TIER_1",
      high.map(([name]) => `${label(name)} is high`),
      evidenceIds,
    );
  if (high.length === 1 || moderate.length >= 2)
    return result(
      "TIER_2",
      [...high, ...moderate].map(
        ([name, value]) => `${label(name)} is ${value.rating.toLowerCase()}`,
      ),
      evidenceIds,
    );
  return result(
    "TIER_3",
    ["Reviewed evidence indicates a smaller or narrowly scoped account"],
    evidenceIds,
  );
}

function result(
  tier: AccountTier,
  reasons: string[],
  evidenceIds: string[],
): AccountTierRecommendation {
  return {
    tier,
    ruleVersion: "account-tier/draft-0.1",
    reasons,
    evidenceIds,
    requiresHumanReview: true,
  };
}

function label(value: keyof AccountTierInput): string {
  return value.replace(/([A-Z])/g, " $1").toLowerCase();
}
