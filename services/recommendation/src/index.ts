import { z } from "zod";

export type ActionType =
  | "RESEARCH"
  | "DEVELOP_ACCESS"
  | "VALIDATE_PROBLEM"
  | "REVIEW_OFFER"
  | "PREPARE_OUTREACH"
  | "MONITOR"
  | "DEPRIORITIZE"
  | "DISQUALIFY"
  | "OTHER";
export interface RecommendationInput {
  priority:
    | "P1_PURSUE_NOW"
    | "P2_DEVELOP"
    | "P3_MONITOR"
    | "P4_LOW_PRIORITY"
    | "INSUFFICIENT_EVIDENCE"
    | "DISQUALIFIED";
  confidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  missingEvidence: string[];
  accessibility: "STRONG" | "MODERATE" | "WEAK" | "UNKNOWN";
  problemEvidence: "STRONG" | "MODERATE" | "WEAK" | "UNKNOWN";
  offerStatus: "NONE" | "HYPOTHESIS" | "REVIEWED" | "APPROVED";
  factors: Array<{ code: string; description: string; evidenceIds: string[] }>;
}
export interface NextAction {
  actionType: ActionType;
  description: string;
  reason: string;
  supportingEvidenceIds: string[];
  materialUncertainties: string[];
  confidence: RecommendationInput["confidence"];
  requiresHumanApproval: true;
  status: "PROPOSED";
  explanationOrigin: "DETERMINISTIC";
  inferenceId: null;
}

export function recommendNextAction(input: RecommendationInput): NextAction {
  let actionType: ActionType, description: string, reason: string;
  if (input.priority === "DISQUALIFIED") {
    actionType = "DISQUALIFY";
    description = "Review and confirm disqualification";
    reason = "A verified disqualifying rule applies";
  } else if (
    input.missingEvidence.some((item) => item.includes("problem")) ||
    input.problemEvidence === "UNKNOWN"
  ) {
    actionType = "VALIDATE_PROBLEM";
    description = "Research and validate the problem hypothesis";
    reason = "Material problem evidence is missing";
  } else if (
    input.missingEvidence.some((item) => item.includes("access")) ||
    ["WEAK", "UNKNOWN"].includes(input.accessibility)
  ) {
    actionType = "DEVELOP_ACCESS";
    description = "Develop a credible access route";
    reason = "Current access is weak or unsupported";
  } else if (input.priority === "INSUFFICIENT_EVIDENCE") {
    actionType = "RESEARCH";
    description = "Collect the missing decision evidence";
    reason = "Priority cannot be determined from current evidence";
  } else if (
    input.offerStatus !== "APPROVED" &&
    ["P1_PURSUE_NOW", "P2_DEVELOP"].includes(input.priority)
  ) {
    actionType = "REVIEW_OFFER";
    description = "Review the evidence-backed VAI offer mapping";
    reason = "A suitable offer requires human review";
  } else if (input.priority === "P1_PURSUE_NOW") {
    actionType = "PREPARE_OUTREACH";
    description = "Prepare human-approved outreach";
    reason = "The opportunity meets P1 conditions";
  } else if (input.priority === "P2_DEVELOP") {
    actionType = "RESEARCH";
    description = "Develop the opportunity with targeted research";
    reason = "The opportunity meets P2 development conditions";
  } else if (input.priority === "P3_MONITOR") {
    actionType = "MONITOR";
    description = "Monitor for a material timing or access change";
    reason = "The opportunity is credible but not ready";
  } else {
    actionType = "DEPRIORITIZE";
    description = "Deprioritize while retaining history";
    reason = "The opportunity currently meets P4 conditions";
  }
  return {
    actionType,
    description,
    reason,
    supportingEvidenceIds: [
      ...new Set(input.factors.flatMap((factor) => factor.evidenceIds)),
    ],
    materialUncertainties: [...input.missingEvidence],
    confidence: input.confidence,
    requiresHumanApproval: true,
    status: "PROPOSED",
    explanationOrigin: "DETERMINISTIC",
    inferenceId: null,
  };
}

const explanationSchema = z
  .object({
    summary: z.string().min(1).max(1000),
    factorCodes: z.array(z.string()).min(1),
  })
  .strict();
export interface ExplanationProvider {
  readonly name: string;
  readonly model: string;
  explain(input: {
    priority: RecommendationInput["priority"];
    actionType: ActionType;
    factors: Array<{ code: string; description: string }>;
  }): Promise<unknown>;
}
export interface Explanation {
  text: string;
  origin: "DETERMINISTIC" | "AI_ASSISTED";
  factorCodes: string[];
  provider: string | null;
  model: string | null;
}
export async function explainRecommendation(
  provider: ExplanationProvider | null,
  input: RecommendationInput,
  action: NextAction,
): Promise<Explanation> {
  const factors = input.factors.map(({ code, description }) => ({
    code,
    description,
  }));
  const fallback = (): Explanation => ({
    text: `${action.description}. ${action.reason}.`,
    origin: "DETERMINISTIC",
    factorCodes: factors.map((f) => f.code),
    provider: null,
    model: null,
  });
  if (!provider) return fallback();
  let raw: unknown;
  try {
    raw = await provider.explain({
      priority: input.priority,
      actionType: action.actionType,
      factors,
    });
  } catch {
    return fallback();
  }
  const parsed = explanationSchema.safeParse(raw);
  if (!parsed.success) return fallback();
  const allowed = new Set(factors.map((f) => f.code));
  if (parsed.data.factorCodes.some((code) => !allowed.has(code)))
    return fallback();
  return {
    text: parsed.data.summary,
    origin: "AI_ASSISTED",
    factorCodes: parsed.data.factorCodes,
    provider: provider.name,
    model: provider.model,
  };
}

export interface ApproachStrategyInput {
  organizationName: string;
  industry: string;
  region: string;
  observedNeeds: Array<{
    statement: string;
    evidenceIds: string[];
    status: "RAW" | "REVIEWED" | "VERIFIED";
  }>;
  approvedOffers: Array<{
    name: string;
    problemTags: string[];
    targetRoles: string[];
  }>;
}

export interface ApproachStrategy {
  positioning: string;
  targetRoles: string[];
  openingAngle: string;
  recommendedOffer: string;
  nextAction: string;
  evidenceIds: string[];
  evidenceGaps: string[];
  requiresHumanApproval: true;
}

export function buildApproachStrategy(
  input: ApproachStrategyInput,
): ApproachStrategy {
  const supportedNeeds = input.observedNeeds.filter(
    (need) =>
      need.status !== "RAW" &&
      need.statement.trim().length > 0 &&
      need.evidenceIds.length > 0,
  );
  if (supportedNeeds.length === 0)
    return {
      positioning: `Research ${input.organizationName} before selecting a positioning hypothesis`,
      targetRoles: [
        "Business or operational leader responsible for the problem area",
      ],
      openingAngle: `Validate the organization's current priorities in ${input.region}`,
      recommendedOffer: "No offer recommended yet",
      nextAction: "Collect reviewed evidence for a material business problem",
      evidenceIds: [],
      evidenceGaps: ["Reviewed problem evidence", "Approved offer fit"],
      requiresHumanApproval: true,
    };

  const need = supportedNeeds[0]!,
    normalizedNeed = need.statement.toLowerCase(),
    offer = input.approvedOffers.find((candidate) =>
      candidate.problemTags.some((tag) =>
        normalizedNeed.includes(tag.toLowerCase()),
      ),
    );
  return {
    positioning: `Position VAI around the evidenced need: ${need.statement}`,
    targetRoles:
      offer?.targetRoles.length && offer.targetRoles.every(Boolean)
        ? [...offer.targetRoles]
        : ["Business or operational leader responsible for the problem area"],
    openingAngle: `Lead with a question about ${need.statement.toLowerCase()} rather than an unsupported solution claim`,
    recommendedOffer: offer?.name ?? "No approved offer matched yet",
    nextAction: offer
      ? "Review the evidence and approve tailored outreach"
      : "Map the evidenced need to an approved VAI offer",
    evidenceIds: [...new Set(need.evidenceIds)],
    evidenceGaps: offer ? [] : ["Approved offer fit"],
    requiresHumanApproval: true,
  };
}
