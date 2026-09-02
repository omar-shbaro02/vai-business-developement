import { randomUUID } from "node:crypto";
import type {
  ExtractedSignal,
  NormalizedAccountProfile,
} from "@vai/enrichment";
import type { Pool, PoolClient } from "pg";

export class EnrichmentStore {
  constructor(private readonly pool: Pool) {}

  async saveProfile(
    tenantId: string,
    profile: NormalizedAccountProfile,
    tierRuleVersion = "account-tier/0.1",
  ): Promise<void> {
    await this.pool.query(
      `insert into account_profiles
       (organization_id,tenant_id,tier,tier_rule_version,website,locations,industry_code,industry_label,industry_evidence_ids,size_context,context,evidence_ids,freshness)
       values ($1,$2,'UNCLASSIFIED',$3,$4,$5::jsonb,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12)
       on conflict (organization_id) do update set website=excluded.website,locations=excluded.locations,
       industry_code=excluded.industry_code,industry_label=excluded.industry_label,industry_evidence_ids=excluded.industry_evidence_ids,
       size_context=excluded.size_context,context=excluded.context,evidence_ids=excluded.evidence_ids,freshness=excluded.freshness,updated_at=now()`,
      [
        profile.organizationId,
        tenantId,
        tierRuleVersion,
        profile.website,
        JSON.stringify(profile.locations),
        profile.industry.code,
        profile.industry.label,
        JSON.stringify(profile.industry.evidenceIds),
        json(profile.sizeContext),
        JSON.stringify(profile.context),
        JSON.stringify(profile.evidenceIds),
        profile.freshness,
      ],
    );
  }

  async saveSignals(
    tenantId: string,
    organizationId: string,
    opportunityId: string | null,
    signals: readonly ExtractedSignal[],
  ): Promise<string[]> {
    return this.transaction(async (client) => {
      const ids: string[] = [];
      for (const signal of signals) {
        if (signal.evidenceIds.length === 0)
          throw new Error("Signal requires supporting evidence");
        if (
          signal.kind === "AI_INFERENCE" &&
          (!signal.derivation.provider ||
            !signal.derivation.model ||
            signal.derivation.validationStatus !== "VALID")
        )
          throw new Error(
            "AI inference requires validated provider provenance",
          );
        const evidence = await client.query<{ id: string }>(
          "select id from evidence_items where tenant_id=$1 and organization_id=$2 and id=any($3::uuid[])",
          [tenantId, organizationId, signal.evidenceIds],
        );
        if (evidence.rows.length !== new Set(signal.evidenceIds).size)
          throw new Error("Signal references unsupported evidence");
        const id = randomUUID();
        await client.query(
          `insert into signals (id,tenant_id,organization_id,opportunity_id,kind,type,value,evidence_ids,model_metadata)
           values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)`,
          [
            id,
            tenantId,
            organizationId,
            opportunityId,
            signal.kind,
            signal.type,
            JSON.stringify(signal.value),
            JSON.stringify(signal.evidenceIds),
            JSON.stringify(signal.derivation),
          ],
        );
        ids.push(id);
      }
      return ids;
    });
  }

  private async transaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await operation(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
function json(value: unknown): string | null {
  return value === null ? null : JSON.stringify(value);
}
