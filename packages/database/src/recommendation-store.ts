import { randomUUID } from "node:crypto";
import type { Explanation, NextAction } from "@vai/recommendation";
import type { Pool } from "pg";

export class RecommendationStore {
  constructor(private readonly pool: Pool) {}
  async propose(input: {
    tenantId: string;
    opportunityId: string;
    priorityDecisionId: string;
    action: NextAction;
    explanation: Explanation;
    expiresAt: string | null;
  }): Promise<string> {
    if (
      !input.action.requiresHumanApproval ||
      input.action.status !== "PROPOSED"
    )
      throw new Error(
        "Recommendations must begin as human-reviewable proposals",
      );
    const id = randomUUID();
    await this.pool.query(
      `insert into recommendations
      (id,tenant_id,opportunity_id,priority_decision_id,action_type,description,reason,status,requires_human_approval,supporting_evidence_ids,material_uncertainties,confidence,explanation_origin,inference_id,expires_at)
      values ($1,$2,$3,$4,$5,$6,$7,'PROPOSED',true,$8::jsonb,$9::jsonb,$10,$11,$12,$13)`,
      [
        id,
        input.tenantId,
        input.opportunityId,
        input.priorityDecisionId,
        input.action.actionType,
        input.explanation.text,
        input.action.reason,
        JSON.stringify(input.action.supportingEvidenceIds),
        JSON.stringify(input.action.materialUncertainties),
        input.action.confidence,
        input.explanation.origin,
        input.action.inferenceId,
        input.expiresAt,
      ],
    );
    return id;
  }
}
