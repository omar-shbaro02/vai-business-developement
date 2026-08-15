import type {
  HypothesisStatus,
  OpportunityStatus,
  RecommendationStatus,
  VerificationStatus,
} from "./values.js";

export type LifecycleName =
  "EVIDENCE" | "HYPOTHESIS" | "OPPORTUNITY" | "RECOMMENDATION";

const transitions = {
  EVIDENCE: {
    RAW: ["REVIEWED", "REJECTED"],
    REVIEWED: ["VERIFIED", "REJECTED"],
    VERIFIED: [],
    REJECTED: [],
  },
  HYPOTHESIS: {
    UNVERIFIED: ["VALIDATED", "REJECTED"],
    VALIDATED: [],
    REJECTED: [],
  },
  OPPORTUNITY: {
    DRAFT: ["ACTIVE"],
    ACTIVE: ["ON_HOLD", "CLOSED"],
    ON_HOLD: ["ACTIVE", "CLOSED"],
    CLOSED: [],
  },
  RECOMMENDATION: {
    PROPOSED: ["APPROVED", "REJECTED", "EXPIRED", "SUPERSEDED"],
    APPROVED: ["EXPIRED", "SUPERSEDED"],
    REJECTED: [],
    EXPIRED: [],
    SUPERSEDED: [],
  },
} as const;

type StateByLifecycle = {
  EVIDENCE: VerificationStatus;
  HYPOTHESIS: HypothesisStatus;
  OPPORTUNITY: OpportunityStatus;
  RECOMMENDATION: RecommendationStatus;
};

export interface TransitionRequest<L extends LifecycleName> {
  lifecycle: L;
  from: StateByLifecycle[L];
  to: StateByLifecycle[L];
  actorId: string;
  occurredAt: string;
  reason?: string;
}

export interface TransitionResult<
  L extends LifecycleName,
> extends TransitionRequest<L> {
  readonly transitionId: string;
}

export function transition<L extends LifecycleName>(
  request: TransitionRequest<L>,
  transitionId: string,
): TransitionResult<L> {
  if (!request.actorId) throw new Error("Transition actor is required");
  const allowed = transitions[request.lifecycle][request.from as never] as
    readonly string[] | undefined;
  if (!allowed?.includes(request.to))
    throw new Error(
      `Transition ${request.lifecycle}:${request.from}->${request.to} is prohibited`,
    );
  return Object.freeze({ ...request, transitionId });
}
