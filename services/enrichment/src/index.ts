import { z } from "zod";

export type Freshness = "CURRENT" | "AGING" | "STALE" | "UNKNOWN";
export interface EvidenceFact {
  id: string;
  type: string;
  normalizedValue: unknown;
  freshness: Freshness;
  verificationStatus: "RAW" | "REVIEWED" | "VERIFIED" | "REJECTED";
}
export interface NormalizedAccountProfile {
  organizationId: string;
  legalName: string;
  displayName: string;
  domains: readonly string[];
  website: string | null;
  locations: Array<{
    country: string | null;
    region: string | null;
    locality: string | null;
  }>;
  industry: {
    code: string | null;
    label: string | null;
    evidenceIds: string[];
  };
  sizeContext: Record<string, unknown> | null;
  context: Record<string, unknown>;
  evidenceIds: string[];
  freshness: Freshness;
}

export function normalizeAccountProfile(
  identity: Pick<
    NormalizedAccountProfile,
    "organizationId" | "legalName" | "displayName" | "domains"
  >,
  evidence: readonly EvidenceFact[],
): NormalizedAccountProfile {
  const usable = evidence.filter(
    (item) =>
      item.verificationStatus !== "REJECTED" && item.normalizedValue !== null,
  );
  const website = valueFor<string>(usable, "WEBSITE");
  const locations =
    valueFor<NormalizedAccountProfile["locations"]>(usable, "LOCATION") ?? [];
  const industryEvidence = usable.filter((item) => item.type === "INDUSTRY");
  const industryValue = objectValue(industryEvidence[0]?.normalizedValue);
  const sizeEvidence = usable.find((item) => item.type === "SIZE_CONTEXT");
  const selected = usable.filter((item) =>
    ["WEBSITE", "LOCATION", "INDUSTRY", "SIZE_CONTEXT"].includes(item.type),
  );
  return {
    ...identity,
    website,
    locations,
    industry: {
      code: typeof industryValue?.code === "string" ? industryValue.code : null,
      label:
        typeof industryValue?.label === "string" ? industryValue.label : null,
      evidenceIds: industryEvidence.map((item) => item.id),
    },
    sizeContext: objectValue(sizeEvidence?.normalizedValue) ?? null,
    context: {},
    evidenceIds: selected.map((item) => item.id),
    freshness: aggregateFreshness(selected),
  };
}

export interface ExtractedSignal {
  kind: "DETERMINISTIC_SIGNAL" | "AI_INFERENCE";
  type: string;
  value: unknown;
  evidenceIds: string[];
  derivation: {
    ruleVersion: string | null;
    provider: string | null;
    model: string | null;
    contractVersion: string | null;
    generatedAt: string | null;
    validationStatus: "NOT_APPLICABLE" | "VALID" | "INVALID" | "NEEDS_REVIEW";
  };
}

export function extractDeterministicSignals(
  evidence: readonly EvidenceFact[],
  ruleVersion = "signals/0.1",
): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];
  for (const item of evidence) {
    if (item.verificationStatus === "REJECTED") continue;
    const value = objectValue(item.normalizedValue);
    if (
      item.type === "EMPLOYEE_GROWTH" &&
      typeof value?.growth_percent === "number"
    )
      signals.push(
        deterministic(
          "EMPLOYEE_GROWTH",
          { growthPercent: value.growth_percent },
          item.id,
          ruleVersion,
        ),
      );
    if (item.type === "FUNDING_EVENT" && typeof value?.date === "string")
      signals.push(
        deterministic(
          "FUNDING_EVENT",
          { date: value.date, amount: value.amount ?? null },
          item.id,
          ruleVersion,
        ),
      );
  }
  return signals;
}

const aiOutputSchema = z
  .object({
    claims: z
      .array(
        z
          .object({
            type: z.string().min(1),
            value: z.unknown(),
            evidenceIds: z.array(z.string().min(1)).min(1),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export interface AiExtractionInput {
  operation: string;
  contractVersion: string;
  evidence: Array<{ id: string; type: string; content: unknown }>;
}
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  extract(input: AiExtractionInput): Promise<unknown>;
}
export type AiExtractionResult =
  | { ok: true; signals: ExtractedSignal[] }
  | {
      ok: false;
      code: "DISABLED" | "PROVIDER_FAILURE" | "INVALID_OUTPUT";
      signals: [];
    };

export async function runBoundedAiExtraction(
  provider: AiProvider | null,
  input: AiExtractionInput,
): Promise<AiExtractionResult> {
  if (!provider) return { ok: false, code: "DISABLED", signals: [] };
  let raw: unknown;
  try {
    raw = await provider.extract(input);
  } catch {
    return { ok: false, code: "PROVIDER_FAILURE", signals: [] };
  }
  const parsed = aiOutputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: "INVALID_OUTPUT", signals: [] };
  const allowed = new Set(input.evidence.map((item) => item.id));
  if (
    parsed.data.claims.some((claim) =>
      claim.evidenceIds.some((id) => !allowed.has(id)),
    )
  )
    return { ok: false, code: "INVALID_OUTPUT", signals: [] };
  const generatedAt = new Date().toISOString();
  return {
    ok: true,
    signals: parsed.data.claims.map((claim) => ({
      kind: "AI_INFERENCE",
      type: claim.type,
      value: claim.value,
      evidenceIds: claim.evidenceIds,
      derivation: {
        ruleVersion: null,
        provider: provider.name,
        model: provider.model,
        contractVersion: input.contractVersion,
        generatedAt,
        validationStatus: "VALID",
      },
    })),
  };
}

function deterministic(
  type: string,
  value: unknown,
  evidenceId: string,
  ruleVersion: string,
): ExtractedSignal {
  return {
    kind: "DETERMINISTIC_SIGNAL",
    type,
    value,
    evidenceIds: [evidenceId],
    derivation: {
      ruleVersion,
      provider: null,
      model: null,
      contractVersion: null,
      generatedAt: null,
      validationStatus: "NOT_APPLICABLE",
    },
  };
}
function valueFor<T>(
  evidence: readonly EvidenceFact[],
  type: string,
): T | null {
  return (
    (evidence.find((item) => item.type === type)?.normalizedValue as
      T | undefined) ?? null
  );
}
function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function aggregateFreshness(evidence: readonly EvidenceFact[]): Freshness {
  if (evidence.length === 0) return "UNKNOWN";
  if (evidence.some((item) => item.freshness === "STALE")) return "STALE";
  if (evidence.some((item) => item.freshness === "AGING")) return "AGING";
  if (evidence.some((item) => item.freshness === "UNKNOWN")) return "UNKNOWN";
  return "CURRENT";
}
