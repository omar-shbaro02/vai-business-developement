import { randomUUID } from "node:crypto";
import { authorize, type ActorContext } from "@vai/auth";
import type { Pool, PoolClient } from "pg";

export interface RecordHumanDecision {
  tenantId: string;
  opportunityId: string;
  systemPriorityDecisionId: string;
  decision: "ACCEPT" | "REJECT" | "DEFER" | "OVERRIDE";
  previousState: Record<string, unknown>;
  selectedState: Record<string, unknown>;
  reason: string | null;
  supportingEvidenceIds: string[];
  actor: ActorContext;
}
export class HumanDecisionStore {
  constructor(private readonly pool: Pool) {}
  async record(
    input: RecordHumanDecision,
  ): Promise<{ id: string; decidedAt: string }> {
    authorize(
      input.actor,
      input.decision === "OVERRIDE" ? "priority:override" : "pursuit:approve",
    );
    if (input.actor.tenantId !== input.tenantId)
      throw new Error("Cross-tenant decision denied");
    if (input.decision === "OVERRIDE" && !input.reason?.trim())
      throw new Error("Override reason is required");
    return this.transaction(async (client) => {
      const decision = await client.query(
        "select id from priority_decisions where tenant_id=$1 and opportunity_id=$2 and id=$3",
        [input.tenantId, input.opportunityId, input.systemPriorityDecisionId],
      );
      if (decision.rowCount !== 1)
        throw new Error("System priority decision not found");
      const id = randomUUID(),
        decidedAt = new Date().toISOString();
      await client.query(
        `insert into human_decisions
        (id,tenant_id,opportunity_id,system_priority_decision_id,decision,previous_state,selected_state,reason,supporting_evidence_ids,decided_by,decided_at)
        values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10,$11)`,
        [
          id,
          input.tenantId,
          input.opportunityId,
          input.systemPriorityDecisionId,
          input.decision,
          JSON.stringify(input.previousState),
          JSON.stringify(input.selectedState),
          input.reason,
          JSON.stringify(input.supportingEvidenceIds),
          input.actor.actorId,
          decidedAt,
        ],
      );
      await client.query(
        `insert into audit_events (tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,before,after)
        values ($1,$2,$3,'human_decision',$4,$5,$6,$7,$8::jsonb,$9::jsonb)`,
        [
          input.tenantId,
          input.actor.actorId,
          `PRIORITY_${input.decision}`,
          id,
          decidedAt,
          input.actor.requestId,
          input.reason,
          JSON.stringify(input.previousState),
          JSON.stringify(input.selectedState),
        ],
      );
      return { id, decidedAt };
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
