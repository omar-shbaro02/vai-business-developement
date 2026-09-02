import { randomUUID } from "node:crypto";
import type { ActorContext } from "@vai/auth";
import {
  decideHypothesis,
  reviewOffer,
  suggestOffer,
  validateOpportunityChange,
  validateReopen,
  type ClosureReason,
  type OfferSuggestion,
  type OpportunityState,
} from "@vai/opportunity";
import type { Pool, PoolClient } from "pg";

export class OpportunityStore {
  constructor(private readonly pool: Pool) {}
  async create(input: {
    tenantId: string;
    organizationId: string;
    title: string;
    problemStatement: string;
    targetPersona: {
      role: string | null;
      knownContactId: string | null;
      evidenceIds: string[];
    };
    actor: ActorContext;
  }) {
    if (!input.title.trim() || !input.problemStatement.trim())
      throw new Error("Opportunity title and problem hypothesis are required");
    return this.transaction(async (client) => {
      const hypothesisId = randomUUID(),
        opportunityId = randomUUID();
      await client.query(
        "insert into problem_hypotheses (id,tenant_id,organization_id,statement,status,evidence_ids,created_by) values ($1,$2,$3,$4,'UNVERIFIED','[]',$5)",
        [
          hypothesisId,
          input.tenantId,
          input.organizationId,
          input.problemStatement,
          input.actor.actorId,
        ],
      );
      await client.query(
        `insert into commercial_opportunities (id,tenant_id,organization_id,title,status,problem_hypothesis_id,target_persona,created_by)
        values ($1,$2,$3,$4,'DRAFT',$5,$6::jsonb,$7)`,
        [
          opportunityId,
          input.tenantId,
          input.organizationId,
          input.title,
          hypothesisId,
          JSON.stringify({
            role: input.targetPersona.role,
            known_contact_id: input.targetPersona.knownContactId,
            evidence_ids: input.targetPersona.evidenceIds,
          }),
          input.actor.actorId,
        ],
      );
      await client.query(
        "update problem_hypotheses set opportunity_id=$1 where id=$2",
        [opportunityId, hypothesisId],
      );
      await this.version(
        client,
        input.tenantId,
        opportunityId,
        1,
        {
          status: "DRAFT",
          problemHypothesisId: hypothesisId,
          targetPersona: input.targetPersona,
        },
        input.actor,
        "Opportunity created",
      );
      return { opportunityId, hypothesisId };
    });
  }
  async transition(input: {
    tenantId: string;
    opportunityId: string;
    target: "ACTIVE" | "ON_HOLD" | "CLOSED";
    reason: string;
    reviewAt?: string;
    closureReason?: ClosureReason;
    actor: ActorContext;
  }) {
    return this.transaction(async (client) => {
      const current = await this.lock(
        client,
        input.tenantId,
        input.opportunityId,
      );
      const next = validateOpportunityChange(
        current,
        input.target,
        {
          reason: input.reason,
          ...(input.reviewAt ? { reviewAt: input.reviewAt } : {}),
          ...(input.closureReason
            ? { closureReason: input.closureReason }
            : {}),
        },
        input.actor,
      );
      await client.query(
        "update commercial_opportunities set status=$1,closure_reason=$2,hold_reason=$3,review_at=$4,updated_at=now() where id=$5 and tenant_id=$6",
        [
          next.status,
          next.closureReason,
          next.holdReason,
          next.reviewAt,
          input.opportunityId,
          input.tenantId,
        ],
      );
      await this.nextVersion(
        client,
        input.tenantId,
        input.opportunityId,
        next,
        input.actor,
        input.reason,
      );
      return next;
    });
  }
  async reopen(input: {
    tenantId: string;
    opportunityId: string;
    reason: string;
    actor: ActorContext;
  }) {
    return this.transaction(async (client) => {
      const current = await this.lock(
        client,
        input.tenantId,
        input.opportunityId,
      );
      const next = validateReopen(current, input.reason, input.actor);
      await client.query(
        "update commercial_opportunities set status='ACTIVE',closure_reason=null,hold_reason=null,review_at=null,updated_at=now() where id=$1 and tenant_id=$2",
        [input.opportunityId, input.tenantId],
      );
      await this.nextVersion(
        client,
        input.tenantId,
        input.opportunityId,
        next,
        input.actor,
        input.reason,
      );
      return next;
    });
  }
  async decideProblem(input: {
    tenantId: string;
    hypothesisId: string;
    status: "VALIDATED" | "REJECTED";
    evidenceIds: string[];
    reason: string;
    actor: ActorContext;
  }) {
    return this.transaction(async (client) => {
      const evidence = await client.query<{ id: string }>(
        "select id from evidence_items where tenant_id=$1 and id=any($2::uuid[]) and verification_status='VERIFIED'",
        [input.tenantId, input.evidenceIds],
      );
      const decision = decideHypothesis(
        {
          status: input.status,
          evidenceIds: input.evidenceIds,
          reason: input.reason,
        },
        input.actor,
        new Set(evidence.rows.map((row) => row.id)),
      );
      const result = await client.query(
        "update problem_hypotheses set status=$1,evidence_ids=$2::jsonb,validated_by=$3,validated_at=now(),updated_at=now() where id=$4 and tenant_id=$5 and status='UNVERIFIED'",
        [
          decision.status,
          JSON.stringify(decision.evidenceIds),
          input.actor.actorId,
          input.hypothesisId,
          input.tenantId,
        ],
      );
      if (result.rowCount !== 1)
        throw new Error("Unverified hypothesis not found");
      await client.query(
        `insert into audit_events (tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,after)
         values ($1,$2,$3,'problem_hypothesis',$4,now(),$5,$6,$7::jsonb)`,
        [
          input.tenantId,
          input.actor.actorId,
          `HYPOTHESIS_${decision.status}`,
          input.hypothesisId,
          input.actor.requestId,
          input.reason,
          JSON.stringify({
            status: decision.status,
            evidenceIds: decision.evidenceIds,
          }),
        ],
      );
      return decision;
    });
  }
  async addOfferSuggestion(input: {
    tenantId: string;
    opportunityId: string;
    suggestion: Omit<OfferSuggestion, "status">;
    actor: ActorContext;
  }) {
    const suggestion = suggestOffer(input.suggestion),
      id = randomUUID();
    await this.pool.query(
      `insert into offer_mappings (id,tenant_id,opportunity_id,offer_id,label,status,evidence_ids,explanation,origin,inference_id,created_by)
      values ($1,$2,$3,$4,$5,'HYPOTHESIS',$6::jsonb,$7,$8,$9,$10)`,
      [
        id,
        input.tenantId,
        input.opportunityId,
        suggestion.offerId,
        suggestion.label,
        JSON.stringify(suggestion.evidenceIds),
        suggestion.explanation,
        suggestion.origin,
        suggestion.inferenceId,
        input.actor.actorId,
      ],
    );
    return id;
  }
  async reviewOffer(input: {
    tenantId: string;
    mappingId: string;
    decision: "REVIEWED" | "APPROVED" | "REJECTED";
    reason: string;
    actor: ActorContext;
  }) {
    return this.transaction(async (client) => {
      const found = await client.query<{
        status: "HYPOTHESIS" | "REVIEWED";
        opportunity_id: string;
      }>(
        "select status,opportunity_id from offer_mappings where id=$1 and tenant_id=$2 for update",
        [input.mappingId, input.tenantId],
      );
      const row = found.rows[0];
      if (!row) throw new Error("Offer mapping not found");
      const status = reviewOffer(
        row.status,
        input.decision,
        input.reason,
        input.actor,
      );
      await client.query(
        "update offer_mappings set status=$1,reviewed_by=$2,reviewed_at=now(),review_reason=$3 where id=$4",
        [status, input.actor.actorId, input.reason, input.mappingId],
      );
      await client.query(
        `insert into audit_events (tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,after)
         values ($1,$2,$3,'offer_mapping',$4,now(),$5,$6,$7::jsonb)`,
        [
          input.tenantId,
          input.actor.actorId,
          `OFFER_${status}`,
          input.mappingId,
          input.actor.requestId,
          input.reason,
          JSON.stringify({ status }),
        ],
      );
      if (status === "APPROVED")
        await client.query(
          "update commercial_opportunities set current_offer_mapping_id=$1,updated_at=now() where id=$2 and tenant_id=$3",
          [input.mappingId, row.opportunity_id, input.tenantId],
        );
      return status;
    });
  }
  private async lock(
    client: PoolClient,
    tenantId: string,
    id: string,
  ): Promise<OpportunityState> {
    const result = await client.query<{
      status: OpportunityState["status"];
      closure_reason: ClosureReason | null;
      hold_reason: string | null;
      review_at: Date | null;
    }>(
      "select status,closure_reason,hold_reason,review_at from commercial_opportunities where tenant_id=$1 and id=$2 for update",
      [tenantId, id],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Opportunity not found");
    return {
      status: row.status,
      closureReason: row.closure_reason,
      holdReason: row.hold_reason,
      reviewAt: row.review_at?.toISOString() ?? null,
    };
  }
  private async nextVersion(
    client: PoolClient,
    tenantId: string,
    id: string,
    state: unknown,
    actor: ActorContext,
    reason: string,
  ) {
    const result = await client.query<{ version: number }>(
      "select coalesce(max(version),0)+1 version from opportunity_versions where tenant_id=$1 and opportunity_id=$2",
      [tenantId, id],
    );
    await this.version(
      client,
      tenantId,
      id,
      result.rows[0]!.version,
      state,
      actor,
      reason,
    );
  }
  private async version(
    client: PoolClient,
    tenantId: string,
    id: string,
    version: number,
    state: unknown,
    actor: ActorContext,
    reason: string,
  ) {
    await client.query(
      "insert into opportunity_versions (tenant_id,opportunity_id,version,state,actor_id,reason) values ($1,$2,$3,$4::jsonb,$5,$6)",
      [tenantId, id, version, JSON.stringify(state), actor.actorId, reason],
    );
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
