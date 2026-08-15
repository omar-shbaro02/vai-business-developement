import { describe, expect, it } from "vitest";
import {
  assertOpportunityRelationships,
  type CommercialOpportunity,
} from "./index.js";

const opportunity: CommercialOpportunity = {
  id: "opp_1",
  tenantId: "tenant_1",
  organizationId: "org_1",
  title: "Opportunity",
  status: "DRAFT",
  problemHypothesisId: "hyp_1",
  accessPathIds: ["access_1"],
  currentAssessmentId: null,
  currentPriorityDecisionId: null,
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("commercial opportunity relationships", () => {
  it("accepts one organization, one hypothesis, and unique access paths", () => {
    expect(() => assertOpportunityRelationships(opportunity)).not.toThrow();
  });

  it("rejects a missing organization", () => {
    expect(() =>
      assertOpportunityRelationships({ ...opportunity, organizationId: "" }),
    ).toThrow(/organization/);
  });

  it("rejects duplicate access relationships", () => {
    expect(() =>
      assertOpportunityRelationships({
        ...opportunity,
        accessPathIds: ["a", "a"],
      }),
    ).toThrow(/unique/);
  });
});
