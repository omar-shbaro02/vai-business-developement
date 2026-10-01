import type { ProspectSearchRequest } from "@vai/contracts";
import type { Pool } from "pg";

export interface ProspectCandidate {
  organizationId: string;
  legalName: string;
  displayName: string;
  website: string | null;
  industry: string | null;
  locations: Array<{
    country: string | null;
    region: string | null;
    locality: string | null;
  }>;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | "UNCLASSIFIED";
  tierRuleVersion: string;
  tierReasons: string[];
  evidenceIds: string[];
  problemStatement: string | null;
  problemEvidenceIds: string[];
  problemStatus: "RAW" | "REVIEWED" | "VERIFIED" | null;
  approvedOffer: string | null;
  targetRoles: string[];
}

export interface ProspectCandidatePage {
  data: ProspectCandidate[];
  page: { cursor: string | null; has_more: boolean };
}

interface CandidateRow {
  organization_id: string;
  legal_name: string;
  display_name: string;
  website: string | null;
  industry: string | null;
  locations: ProspectCandidate["locations"];
  tier: ProspectCandidate["tier"];
  tier_rule_version: string;
  context: { tier_reasons?: unknown } | null;
  evidence_ids: string[];
  problem_statement: string | null;
  problem_evidence_ids: string[] | null;
  problem_status: "UNVERIFIED" | "VALIDATED" | null;
  approved_offer: string | null;
  target_persona: { role?: unknown } | null;
}

export class ProspectSearchStore {
  constructor(private readonly pool: Pick<Pool, "query">) {}

  async search(
    tenantId: string,
    input: ProspectSearchRequest,
  ): Promise<ProspectCandidatePage> {
    const values: unknown[] = [
        tenantId,
        `%${escapeLike(input.industry)}%`,
        `%${escapeLike(input.region)}%`,
        input.tier,
        input.cursor,
        input.limit + 1,
      ],
      result = await this.pool.query<CandidateRow>(
        `select o.id organization_id,o.legal_name,o.display_name,ap.website,
                ap.industry_label industry,ap.locations,ap.tier,ap.tier_rule_version,
                ap.context,ap.evidence_ids,problem.statement problem_statement,
                problem.evidence_ids problem_evidence_ids,problem.status problem_status,
                problem.approved_offer,problem.target_persona
           from organizations o
           join account_profiles ap on ap.organization_id=o.id and ap.tenant_id=o.tenant_id
           left join lateral (
             select ph.statement,ph.evidence_ids,ph.status,om.label approved_offer,
                    co.target_persona
               from commercial_opportunities co
               join problem_hypotheses ph on ph.id=co.problem_hypothesis_id
               left join offer_mappings om on om.id=co.current_offer_mapping_id
                                      and om.status='APPROVED'
              where co.tenant_id=o.tenant_id and co.organization_id=o.id
              order by co.updated_at desc limit 1
           ) problem on true
          where o.tenant_id=$1 and o.merged_into_id is null
            and ap.industry_label ilike $2 escape '\\'
            and exists (
              select 1 from jsonb_array_elements(ap.locations) location
               where coalesce(location->>'region','') ilike $3 escape '\\'
                  or coalesce(location->>'locality','') ilike $3 escape '\\'
                  or coalesce(location->>'country','') ilike $3 escape '\\'
            )
            and ($4::text is null or ap.tier=$4)
            and ($5::uuid is null or o.id>$5::uuid)
          order by o.id limit $6`,
        values,
      ),
      hasMore = result.rows.length > input.limit,
      rows = result.rows.slice(0, input.limit);
    return {
      data: rows.map(mapCandidate),
      page: {
        cursor: hasMore ? (rows.at(-1)?.organization_id ?? null) : null,
        has_more: hasMore,
      },
    };
  }
}

function mapCandidate(row: CandidateRow): ProspectCandidate {
  const persona = row.target_persona?.role;
  return {
    organizationId: row.organization_id,
    legalName: row.legal_name,
    displayName: row.display_name,
    website: row.website,
    industry: row.industry,
    locations: row.locations,
    tier: row.tier,
    tierRuleVersion: row.tier_rule_version,
    tierReasons: strings(row.context?.tier_reasons),
    evidenceIds: row.evidence_ids,
    problemStatement: row.problem_statement,
    problemEvidenceIds: row.problem_evidence_ids ?? [],
    problemStatus:
      row.problem_status === "VALIDATED"
        ? "VERIFIED"
        : row.problem_status === "UNVERIFIED"
          ? "RAW"
          : null,
    approvedOffer: row.approved_offer,
    targetRoles: typeof persona === "string" && persona ? [persona] : [],
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function escapeLike(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}
