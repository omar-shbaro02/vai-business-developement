import { describe, expect, it } from "vitest";
import {
  decideHypothesis,
  reviewOffer,
  suggestOffer,
  validateOpportunityChange,
  validateReopen,
} from "./index.js";
const operator = {
  actorId: "actor",
  tenantId: "tenant",
  roles: ["BD_OPERATOR" as const],
  authenticated: true,
  requestId: "request",
};
const owner = { ...operator, roles: ["COMMERCIAL_OWNER" as const] };
describe("opportunity engine", () => {
  it("governs hold, close, and owner-only reopening details", () => {
    const active = {
      status: "ACTIVE" as const,
      closureReason: null,
      holdReason: null,
      reviewAt: null,
    };
    expect(() =>
      validateOpportunityChange(
        active,
        "ON_HOLD",
        { reason: "pause" },
        operator,
      ),
    ).toThrow("review date");
    const closed = validateOpportunityChange(
      active,
      "CLOSED",
      { reason: "not proceeding", closureReason: "NO_DECISION" },
      operator,
    );
    expect(() => validateReopen(closed, "reconsider", operator)).toThrow(
      "Forbidden",
    );
    expect(validateReopen(closed, "new evidence", owner).status).toBe("ACTIVE");
  });
  it("requires a human decision and verified evidence to validate hypotheses", () => {
    expect(() =>
      decideHypothesis(
        { status: "VALIDATED", evidenceIds: ["raw"], reason: "looks right" },
        owner,
        new Set(),
      ),
    ).toThrow("verified evidence");
    expect(
      decideHypothesis(
        { status: "VALIDATED", evidenceIds: ["verified"], reason: "confirmed" },
        owner,
        new Set(["verified"]),
      ).status,
    ).toBe("VALIDATED");
    expect(
      decideHypothesis(
        {
          status: "REJECTED",
          evidenceIds: [],
          reason: "incorrect attribution",
        },
        owner,
        new Set(),
      ).status,
    ).toBe("REJECTED");
  });
  it("keeps AI offer suggestions hypothetical until separate review and approval", () => {
    const suggestion = suggestOffer({
      offerId: "offer-1",
      label: "Growth workshop",
      evidenceIds: ["ev-1"],
      explanation: "Evidence-linked fit",
      origin: "AI_ASSISTED",
      inferenceId: "inference-1",
    });
    expect(suggestion.status).toBe("HYPOTHESIS");
    expect(() =>
      reviewOffer("HYPOTHESIS", "APPROVED", "approve", owner),
    ).toThrow("reviewed before approval");
    expect(
      reviewOffer("HYPOTHESIS", "REVIEWED", "commercial review", operator),
    ).toBe("REVIEWED");
    expect(reviewOffer("REVIEWED", "APPROVED", "owner approval", owner)).toBe(
      "APPROVED",
    );
  });
});
