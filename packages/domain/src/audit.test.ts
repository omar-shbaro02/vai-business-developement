import { describe, expect, it } from "vitest";
import { createAuditEvent } from "./index.js";

describe("typed audit events", () => {
  it("requires actor, tenant, and request identity", () => {
    expect(() =>
      createAuditEvent({
        id: "audit_1",
        tenantId: "tenant_1",
        actorId: "",
        action: "opportunity.update",
        resourceType: "CommercialOpportunity",
        resourceId: "opp_1",
        occurredAt: "2026-08-15T00:00:00.000Z",
        requestId: "request_1",
        reason: null,
        before: null,
        after: { status: "ACTIVE" },
      }),
    ).toThrow(/required/);
  });

  it("returns an immutable event", () => {
    const event = createAuditEvent({
      id: "audit_2",
      tenantId: "tenant_1",
      actorId: "user_1",
      action: "opportunity.update",
      resourceType: "CommercialOpportunity",
      resourceId: "opp_1",
      occurredAt: "2026-08-15T00:00:00.000Z",
      requestId: "request_1",
      reason: null,
      before: { status: "DRAFT" },
      after: { status: "ACTIVE" },
    });
    expect(Object.isFrozen(event)).toBe(true);
  });
});
