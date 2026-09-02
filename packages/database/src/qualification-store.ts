import { randomUUID } from "node:crypto";
import type {
  ConfidenceResult,
  DimensionName,
  DimensionResult,
  MissingEvidence,
} from "@vai/qualification";
import type { Pool, PoolClient } from "pg";

export class QualificationStore {
  constructor(private readonly pool: Pool) {}

  async save(input: {
    tenantId: string;
    opportunityId: string;
    dimensions: Record<DimensionName, DimensionResult>;
    confidence: ConfidenceResult;
    missingEvidence: MissingEvidence[];
    ruleVersion: string;
    calculatedAt: string;
  }): Promise<string> {
    return this.transaction(async (client) => {
      const opportunity = await client.query<{
        current_assessment_id: string | null;
      }>(
        "select current_assessment_id from commercial_opportunities where tenant_id=$1 and id=$2 for update",
        [input.tenantId, input.opportunityId],
      );
      if (!opportunity.rows[0])
        throw new Error("Opportunity not found in tenant");
      const id = randomUUID();
      await client.query(
        `insert into qualification_assessments
         (id,tenant_id,opportunity_id,dimensions,confidence,confidence_factors,missing_evidence,rule_version,calculated_at,supersedes_assessment_id)
         values ($1,$2,$3,$4::jsonb,$5,$6::jsonb,$7::jsonb,$8,$9,$10)`,
        [
          id,
          input.tenantId,
          input.opportunityId,
          JSON.stringify(input.dimensions),
          input.confidence.confidence,
          JSON.stringify(input.confidence.factors),
          JSON.stringify(input.missingEvidence),
          input.ruleVersion,
          input.calculatedAt,
          opportunity.rows[0].current_assessment_id,
        ],
      );
      await client.query(
        "update commercial_opportunities set current_assessment_id=$1,updated_at=now() where tenant_id=$2 and id=$3",
        [id, input.tenantId, input.opportunityId],
      );
      return id;
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
