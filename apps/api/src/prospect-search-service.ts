import type { ActorContext } from "@vai/auth";
import type {
  ProspectSearchRequest,
  ProspectSearchResult,
} from "@vai/contracts";
import type { ProspectCandidatePage, ProspectSearchStore } from "@vai/database";
import { buildApproachStrategy } from "@vai/recommendation";
import type { Page } from "./app.js";

export function createProspectSearchService(store: ProspectSearchStore) {
  return async (
    actor: ActorContext,
    input: ProspectSearchRequest,
  ): Promise<Page<ProspectSearchResult>> => {
    const page = await store.search(actor.tenantId, input);
    return {
      data: page.data.map((candidate) => mapCandidate(candidate, input)),
      page: page.page,
    };
  };
}

function mapCandidate(
  candidate: ProspectCandidatePage["data"][number],
  search: ProspectSearchRequest,
): ProspectSearchResult {
  const strategy = buildApproachStrategy({
    organizationName: candidate.displayName,
    industry: candidate.industry ?? search.industry,
    region: search.region,
    observedNeeds: candidate.problemStatement
      ? [
          {
            statement: candidate.problemStatement,
            evidenceIds: candidate.problemEvidenceIds,
            status: candidate.problemStatus ?? "RAW",
          },
        ]
      : [],
    approvedOffers: candidate.approvedOffer
      ? [
          {
            name: candidate.approvedOffer,
            problemTags: candidate.problemStatement
              ? [candidate.problemStatement]
              : [],
            targetRoles: candidate.targetRoles,
          },
        ]
      : [],
  });
  return {
    organization_id: candidate.organizationId,
    legal_name: candidate.legalName,
    display_name: candidate.displayName,
    website: validUrl(candidate.website),
    industry: candidate.industry,
    locations: candidate.locations,
    tier: candidate.tier,
    tier_rule_version: candidate.tierRuleVersion,
    tier_reasons:
      candidate.tierReasons.length > 0
        ? candidate.tierReasons
        : ["Tier rationale requires review"],
    evidence_ids: candidate.evidenceIds,
    strategy: {
      positioning: strategy.positioning,
      target_roles: strategy.targetRoles,
      opening_angle: strategy.openingAngle,
      recommended_offer: strategy.recommendedOffer,
      next_action: strategy.nextAction,
      evidence_gaps: strategy.evidenceGaps,
      requires_human_approval: true,
    },
  };
}

function validUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}
