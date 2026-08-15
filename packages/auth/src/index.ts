export const roles = [
  "ADMIN",
  "COMMERCIAL_OWNER",
  "BD_OPERATOR",
  "RESEARCHER",
  "REVIEWER",
  "READ_ONLY",
] as const;
export type Role = (typeof roles)[number];

export const capabilities = [
  "evidence:capture",
  "evidence:review",
  "evidence:verify",
  "hypothesis:decide",
  "opportunity:write",
  "pursuit:approve",
  "priority:override",
  "outcome:record",
  "organization:merge",
  "rules:change",
  "governed:read",
] as const;
export type Capability = (typeof capabilities)[number];

export interface ActorContext {
  actorId: string;
  tenantId: string;
  roles: readonly Role[];
  authenticated: boolean;
  requestId: string;
}

const roleCapabilities: Readonly<Record<Role, ReadonlySet<Capability>>> = {
  ADMIN: new Set(capabilities),
  COMMERCIAL_OWNER: new Set(
    capabilities.filter((capability) => capability !== "rules:change"),
  ),
  BD_OPERATOR: new Set([
    "evidence:capture",
    "opportunity:write",
    "outcome:record",
    "governed:read",
  ]),
  RESEARCHER: new Set([
    "evidence:capture",
    "opportunity:write",
    "governed:read",
  ]),
  REVIEWER: new Set([
    "evidence:review",
    "evidence:verify",
    "hypothesis:decide",
    "governed:read",
  ]),
  READ_ONLY: new Set(["governed:read"]),
};

export function requireAuthenticated(context: ActorContext): ActorContext {
  if (
    !context.authenticated ||
    !context.actorId ||
    !context.tenantId ||
    !context.requestId
  )
    throw new Error("Unauthenticated actor context");
  return context;
}

export function authorize(
  context: ActorContext,
  capability: Capability,
): ActorContext {
  requireAuthenticated(context);
  if (!context.roles.some((role) => roleCapabilities[role].has(capability)))
    throw new Error(`Forbidden capability: ${capability}`);
  return context;
}
