import { randomUUID } from "node:crypto";
import { PRIORITY_RULE_VERSION, type PriorityResult } from "@vai/priority";
import type { Pool, PoolClient } from "pg";

export class PriorityDecisionStore {
  constructor(private readonly pool: Pool) {}
  async save(input: {
    tenantId: string;
    opportunityId: string;
    assessmentId: string;
    decision: PriorityResult;
    calculatedAt: string;
  }): Promise<string> {
    if (input.decision.ruleVersion !== PRIORITY_RULE_VERSION)
      throw new Error("Unsupported priority rule version");
    return this.transaction(async (client) => {
      const opportunity = await client.query<{
        current_priority_decision_id: string | null;
      }>(
        "select current_priority_decision_id from commercial_opportunities where tenant_id=$1 and id=$2 for update",
        [input.tenantId, input.opportunityId],
      );
      if (!opportunity.rows[0])
        throw new Error("Opportunity not found in tenant");
      const assessment = await client.query(
        "select id from qualification_assessments where id=$1 and tenant_id=$2 and opportunity_id=$3",
        [input.assessmentId, input.tenantId, input.opportunityId],
      );
      if (assessment.rowCount !== 1)
        throw new Error("Assessment not found for opportunity");
      const id = randomUUID(),
        allFactors = [
          ...input.decision.positiveFactors,
          ...input.decision.negativeFactors,
        ];
      await client.query(
        `insert into priority_decisions
        (id,tenant_id,opportunity_id,assessment_id,priority,confidence,factor_ids,positive_factors,negative_factors,missing_evidence,disqualifying_rules,rule_version,calculated_at,supersedes_priority_decision_id)
        values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14)`,
        [
          id,
          input.tenantId,
          input.opportunityId,
          input.assessmentId,
          input.decision.priority,
          input.decision.confidence,
          JSON.stringify(allFactors.map((f) => f.code)),
          JSON.stringify(input.decision.positiveFactors),
          JSON.stringify(input.decision.negativeFactors),
          JSON.stringify(input.decision.missingEvidence),
          JSON.stringify(input.decision.disqualifyingRules),
          input.decision.ruleVersion,
          input.calculatedAt,
          opportunity.rows[0].current_priority_decision_id,
        ],
      );
      await client.query(
        "update commercial_opportunities set current_priority_decision_id=$1,updated_at=now() where tenant_id=$2 and id=$3",
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
