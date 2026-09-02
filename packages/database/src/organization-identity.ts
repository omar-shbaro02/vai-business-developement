import { randomUUID } from "node:crypto";
import { detectDuplicateOrganizations } from "@vai/domain";
import type { Pool, PoolClient } from "pg";

export interface MergeCommand {
  tenantId: string;
  candidateId: string;
  canonicalOrganizationId: string;
  actorId: string;
  requestId: string;
  reason: string;
}

type CandidateRow = {
  id: string;
  source_organization_id: string;
  target_organization_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export class OrganizationIdentityRepository {
  constructor(private readonly pool: Pool) {}

  async detectCandidates(tenantId: string): Promise<number> {
    const result = await this.pool.query<{
      id: string;
      legal_name: string;
      display_name: string;
      domains: string[];
    }>(
      `select o.id, o.legal_name, o.display_name, coalesce(array_agg(d.domain) filter (where d.domain is not null), '{}') domains
       from organizations o left join organization_domains d on d.organization_id = o.id
       where o.tenant_id = $1 and o.merged_into_id is null group by o.id`,
      [tenantId],
    );
    const candidates = detectDuplicateOrganizations(
      result.rows.map((row) => ({
        id: row.id,
        legalName: row.legal_name,
        displayName: row.display_name,
        domains: row.domains,
      })),
    );
    let inserted = 0;
    for (const candidate of candidates) {
      const write = await this.pool.query(
        `insert into organization_merge_candidates
         (tenant_id, source_organization_id, target_organization_id, score, reasons)
         values ($1, $2, $3, $4, $5::jsonb) on conflict do nothing returning id`,
        [
          tenantId,
          candidate.sourceOrganizationId,
          candidate.targetOrganizationId,
          candidate.score.toFixed(2),
          JSON.stringify(candidate.reasons),
        ],
      );
      inserted += write.rowCount ?? 0;
    }
    return inserted;
  }

  async approveMerge(command: MergeCommand): Promise<string> {
    if (!command.reason.trim())
      throw new Error("Organization merge requires a reason");
    return this.transaction(async (client) => {
      const candidateResult = await client.query<CandidateRow>(
        `select id, source_organization_id, target_organization_id, status from organization_merge_candidates
         where id = $1 and tenant_id = $2 for update`,
        [command.candidateId, command.tenantId],
      );
      const candidate = candidateResult.rows[0];
      if (!candidate || candidate.status !== "PENDING")
        throw new Error("Pending merge candidate not found");
      const pair = [
        candidate.source_organization_id,
        candidate.target_organization_id,
      ];
      if (!pair.includes(command.canonicalOrganizationId))
        throw new Error("Canonical organization must belong to the candidate");
      const aliasId = pair.find((id) => id !== command.canonicalOrganizationId);
      if (!aliasId) throw new Error("Cannot merge an organization into itself");

      const active = await client.query<{ id: string }>(
        "select id from organizations where tenant_id = $1 and id in ($2, $3) and merged_into_id is null for update",
        [command.tenantId, pair[0], pair[1]],
      );
      if (active.rowCount !== 2)
        throw new Error("Both organizations must be active in the same tenant");
      const profiles = await client.query<{ organization_id: string }>(
        "select organization_id from account_profiles where tenant_id = $1 and organization_id in ($2, $3) for update",
        [command.tenantId, pair[0], pair[1]],
      );
      if (profiles.rowCount === 2)
        throw new Error(
          "Account profile conflict requires manual resolution before merge",
        );

      const moved: Record<string, string[]> = {};
      for (const [table, key] of [
        ["commercial_opportunities", "opportunities"],
        ["evidence_items", "evidence"],
        ["signals", "signals"],
      ] as const) {
        const result = await client.query<{ id: string }>(
          `update ${table} set organization_id = $1 where tenant_id = $2 and organization_id = $3 returning id`,
          [command.canonicalOrganizationId, command.tenantId, aliasId],
        );
        moved[key] = result.rows.map((row) => row.id);
      }
      const profile = await client.query<{ organization_id: string }>(
        "update account_profiles set organization_id = $1 where tenant_id = $2 and organization_id = $3 returning organization_id",
        [command.canonicalOrganizationId, command.tenantId, aliasId],
      );
      moved.accountProfile = profile.rowCount ? [aliasId] : [];

      await client.query(
        `insert into organization_domains (tenant_id, organization_id, domain, source_type, source_reference, created_at)
         select tenant_id, $1, domain, source_type, source_reference, created_at from organization_domains
         where tenant_id = $2 and organization_id = $3 on conflict do nothing`,
        [command.canonicalOrganizationId, command.tenantId, aliasId],
      );
      const mergeEventId = randomUUID();
      await client.query(
        `insert into organization_merge_events
         (id, tenant_id, candidate_id, canonical_organization_id, alias_organization_id, moved_relationships, approved_by, reason)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
        [
          mergeEventId,
          command.tenantId,
          command.candidateId,
          command.canonicalOrganizationId,
          aliasId,
          JSON.stringify(moved),
          command.actorId,
          command.reason,
        ],
      );
      await client.query(
        `insert into organization_aliases (tenant_id, canonical_organization_id, alias_organization_id, merge_event_id)
         values ($1,$2,$3,$4)`,
        [
          command.tenantId,
          command.canonicalOrganizationId,
          aliasId,
          mergeEventId,
        ],
      );
      await client.query(
        "update organizations set merged_into_id = $1, updated_at = now() where tenant_id = $2 and id = $3",
        [command.canonicalOrganizationId, command.tenantId, aliasId],
      );
      await client.query(
        `update organization_merge_candidates set status='APPROVED', reviewed_by=$1, reviewed_at=now(), review_reason=$2
         where tenant_id=$3 and id=$4`,
        [
          command.actorId,
          command.reason,
          command.tenantId,
          command.candidateId,
        ],
      );
      await client.query(
        `insert into audit_events (tenant_id, actor_id, action, resource_type, resource_id, occurred_at, request_id, reason, after)
         values ($1,$2,'ORGANIZATION_MERGED','organization',$3,now(),$4,$5,$6::jsonb)`,
        [
          command.tenantId,
          command.actorId,
          command.canonicalOrganizationId,
          command.requestId,
          command.reason,
          JSON.stringify({ aliasOrganizationId: aliasId, mergeEventId }),
        ],
      );
      return mergeEventId;
    });
  }

  async rejectCandidate(
    command: Omit<MergeCommand, "canonicalOrganizationId">,
  ): Promise<void> {
    if (!command.reason.trim())
      throw new Error("Candidate rejection requires a reason");
    const result = await this.pool.query(
      `update organization_merge_candidates set status='REJECTED', reviewed_by=$1, reviewed_at=now(), review_reason=$2
       where tenant_id=$3 and id=$4 and status='PENDING'`,
      [command.actorId, command.reason, command.tenantId, command.candidateId],
    );
    if (result.rowCount !== 1)
      throw new Error("Pending merge candidate not found");
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
