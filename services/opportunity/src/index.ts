import { authorize, type ActorContext } from "@vai/auth";

export type OpportunityStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "CLOSED";
export type ClosureReason = "WON" | "LOST" | "NO_DECISION" | "DISQUALIFIED";
export interface OpportunityState {
  status: OpportunityStatus;
  closureReason: ClosureReason | null;
  holdReason: string | null;
  reviewAt: string | null;
}

export function validateOpportunityChange(
  current: OpportunityState,
  target: OpportunityStatus,
  details: { reason: string; reviewAt?: string; closureReason?: ClosureReason },
  actor: ActorContext,
): OpportunityState {
  authorize(actor, "opportunity:write");
  if (!details.reason.trim())
    throw new Error("Opportunity transition requires a reason");
  const allowed: Record<OpportunityStatus, OpportunityStatus[]> = {
    DRAFT: ["ACTIVE"],
    ACTIVE: ["ON_HOLD", "CLOSED"],
    ON_HOLD: ["ACTIVE", "CLOSED"],
    CLOSED: [],
  };
  if (!allowed[current.status].includes(target))
    throw new Error(
      `Opportunity transition ${current.status}->${target} is prohibited`,
    );
  if (
    target === "ON_HOLD" &&
    (!details.reviewAt || !Number.isFinite(Date.parse(details.reviewAt)))
  )
    throw new Error("ON_HOLD requires a review date");
  if (target === "CLOSED" && !details.closureReason)
    throw new Error("CLOSED requires a closure reason");
  return {
    status: target,
    closureReason: target === "CLOSED" ? details.closureReason! : null,
    holdReason: target === "ON_HOLD" ? details.reason : null,
    reviewAt: target === "ON_HOLD" ? details.reviewAt! : null,
  };
}

export function validateReopen(
  current: OpportunityState,
  reason: string,
  actor: ActorContext,
): OpportunityState {
  authorize(actor, "pursuit:approve");
  if (current.status !== "CLOSED")
    throw new Error("Only closed opportunities can be reopened");
  if (!reason.trim()) throw new Error("Reopen requires a reason");
  return {
    status: "ACTIVE",
    closureReason: null,
    holdReason: null,
    reviewAt: null,
  };
}

export interface HypothesisDecision {
  status: "VALIDATED" | "REJECTED";
  evidenceIds: string[];
  reason: string;
}
export function decideHypothesis(
  input: HypothesisDecision,
  actor: ActorContext,
  verifiedEvidenceIds: ReadonlySet<string>,
): HypothesisDecision {
  authorize(actor, "hypothesis:decide");
  if (!input.reason.trim())
    throw new Error("Hypothesis decision requires a reason");
  if (
    input.status === "VALIDATED" &&
    !input.evidenceIds.some((id) => verifiedEvidenceIds.has(id))
  )
    throw new Error("Validation requires approved verified evidence");
  return { ...input, evidenceIds: [...input.evidenceIds] };
}

export interface OfferSuggestion {
  offerId: string;
  label: string;
  evidenceIds: string[];
  explanation: string;
  origin: "DETERMINISTIC" | "AI_ASSISTED";
  inferenceId: string | null;
  status: "HYPOTHESIS";
}
export function suggestOffer(
  input: Omit<OfferSuggestion, "status">,
): OfferSuggestion {
  if (!input.offerId || !input.label || !input.explanation.trim())
    throw new Error("Offer suggestion must be explainable");
  if (input.evidenceIds.length === 0)
    throw new Error("Offer suggestion requires supporting evidence");
  if (input.origin === "AI_ASSISTED" && !input.inferenceId)
    throw new Error("AI offer suggestion requires inference provenance");
  return { ...input, status: "HYPOTHESIS" };
}
export function reviewOffer(
  current: "HYPOTHESIS" | "REVIEWED",
  decision: "REVIEWED" | "APPROVED" | "REJECTED",
  reason: string,
  actor: ActorContext,
) {
  authorize(
    actor,
    decision === "APPROVED" ? "pursuit:approve" : "opportunity:write",
  );
  if (!reason.trim()) throw new Error("Offer review requires a reason");
  if (current === "HYPOTHESIS" && !["REVIEWED", "REJECTED"].includes(decision))
    throw new Error("Offer must be reviewed before approval");
  if (current === "REVIEWED" && !["APPROVED", "REJECTED"].includes(decision))
    throw new Error("Reviewed offer requires approval or rejection");
  return decision;
}
