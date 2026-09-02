import { authorize, type ActorContext } from "@vai/auth";

export const GOVERNANCE_POLICY_VERSION = "governance/0.1" as const;
export type SourceKind = "MANUAL" | "CSV_IMPORT" | "APPROVED_CONNECTOR";
export const sourcePolicies = {
  MANUAL: {
    enabled: true,
    decision: "DATA-GOVERNANCE/0.2",
    requiresAttestation: true,
  },
  CSV_IMPORT: { enabled: true, decision: "DEC-032", requiresAttestation: true },
  APPROVED_CONNECTOR: {
    enabled: false,
    decision: "DEC-004/TASK-032",
    requiresAttestation: false,
  },
} as const satisfies Record<
  SourceKind,
  { enabled: boolean; decision: string; requiresAttestation: boolean }
>;

export function authorizeSource(kind: SourceKind, attested: boolean) {
  const policy = sourcePolicies[kind];
  if (!policy.enabled)
    throw new Error(`Source disabled pending approval: ${kind}`);
  if (policy.requiresAttestation && !attested)
    throw new Error(`Source attestation required: ${kind}`);
  return {
    kind,
    policyVersion: GOVERNANCE_POLICY_VERSION,
    approvalReference: policy.decision,
  };
}

export type RetentionClass =
  "RAW_IMPORT" | "BUSINESS_CONTACT" | "REJECTED_PAYLOAD" | "AUDIT_EVENT";
const retentionDays: Record<RetentionClass, number> = {
  RAW_IMPORT: 30,
  BUSINESS_CONTACT: 365,
  REJECTED_PAYLOAD: 30,
  AUDIT_EVENT: 730,
};
export function retentionDisposition(input: {
  dataClass: RetentionClass;
  referenceAt: string;
  asOf: string;
}) {
  const dueAt = new Date(
    Date.parse(input.referenceAt) + retentionDays[input.dataClass] * 86_400_000,
  ).toISOString();
  const due = Date.parse(input.asOf) >= Date.parse(dueAt);
  return {
    policyVersion: GOVERNANCE_POLICY_VERSION,
    dueAt,
    action: due
      ? input.dataClass === "AUDIT_EVENT"
        ? "REVIEW_MINIMUM_MET"
        : "REVIEW_OR_DELETE"
      : "RETAIN",
  } as const;
}

export function authorizeDataExport(
  context: ActorContext,
  input: { purpose: string; filters: Record<string, string> },
) {
  authorize(context, "data:export");
  if (!input.purpose.trim()) throw new Error("Export purpose is required");
  return {
    action: "DATA_EXPORT_REQUESTED",
    tenantId: context.tenantId,
    actorId: context.actorId,
    requestId: context.requestId,
    purpose: input.purpose,
    filters: { ...input.filters },
    policyVersion: GOVERNANCE_POLICY_VERSION,
  };
}

export function authorizeDataDeletion(
  context: ActorContext,
  input: { resourceType: string; resourceId: string; reason: string },
) {
  authorize(context, "data:delete");
  if (!input.reason.trim()) throw new Error("Deletion reason is required");
  return {
    action: "DATA_DELETION_REQUESTED",
    tenantId: context.tenantId,
    actorId: context.actorId,
    requestId: context.requestId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    reason: input.reason,
    preserveAuditTombstone: true,
    policyVersion: GOVERNANCE_POLICY_VERSION,
  };
}

const prohibitedAiKeys =
  /^(name|email|phone|profile_url|relationship_notes|raw_value|raw_content)$/i;
export function minimizeAiPayload(input: {
  operation: string;
  contractVersion: string;
  evidence: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
  }>;
}) {
  return {
    operation: input.operation,
    contractVersion: input.contractVersion,
    evidence: input.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      content: Object.fromEntries(
        Object.entries(item.content).filter(
          ([key]) => !prohibitedAiKeys.test(key),
        ),
      ),
    })),
  };
}
