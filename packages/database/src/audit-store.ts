import { authorize, type ActorContext } from "@vai/auth";
import type { Pool } from "pg";

const sensitiveKey =
  /^(authorization|cookie|password|secret|token|api[_-]?key|raw_value|rawrecord)$/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        sensitiveKey.test(key) ? "[REDACTED]" : redactAuditValue(child),
      ]),
    );
  return value;
}

export interface AuditWrite {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  requestId: string;
  reason: string | null;
  before: unknown;
  after: unknown;
  metadata?: unknown;
}

export class AuditHistoryStore {
  constructor(private readonly pool: Pool) {}

  async append(event: AuditWrite): Promise<void> {
    await this.pool.query(
      `insert into audit_events (id,tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,before,after,metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb)`,
      [
        event.id,
        event.tenantId,
        event.actorId,
        event.action,
        event.resourceType,
        event.resourceId,
        event.occurredAt,
        event.requestId,
        event.reason,
        json(event.before),
        json(event.after),
        json(redactAuditValue(event.metadata ?? {})),
      ],
    );
  }

  async history(
    context: ActorContext,
    resourceType: string,
    resourceId: string,
  ) {
    authorize(context, "governed:read");
    const result = await this.pool.query(
      `select id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,before,after,metadata
       from audit_events where tenant_id=$1 and resource_type=$2 and resource_id=$3 order by occurred_at,id`,
      [context.tenantId, resourceType, resourceId],
    );
    return result.rows;
  }

  async prioritySnapshot(context: ActorContext, decisionId: string) {
    authorize(context, "governed:read");
    const result = await this.pool.query(
      "select * from priority_decisions where tenant_id=$1 and id=$2",
      [context.tenantId, decisionId],
    );
    return result.rows[0] ?? null;
  }
}

function json(value: unknown): string | null {
  return value === null ? null : JSON.stringify(redactAuditValue(value));
}
