import type { DateTime, OpaqueId } from "./values.js";

export interface AuditEvent<TBefore = unknown, TAfter = unknown> {
  readonly id: OpaqueId;
  readonly tenantId: OpaqueId;
  readonly actorId: OpaqueId;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: OpaqueId;
  readonly occurredAt: DateTime;
  readonly requestId: string;
  readonly reason: string | null;
  readonly before: TBefore | null;
  readonly after: TAfter | null;
}

export function createAuditEvent<TBefore, TAfter>(
  event: AuditEvent<TBefore, TAfter>,
): Readonly<AuditEvent<TBefore, TAfter>> {
  if (!event.actorId || !event.tenantId || !event.requestId)
    throw new Error("Audit actor, tenant, and request are required");
  return Object.freeze({ ...event });
}
