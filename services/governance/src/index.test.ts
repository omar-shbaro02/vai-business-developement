import { describe, expect, it } from "vitest";
import type { ActorContext } from "@vai/auth";
import {
  authorizeDataDeletion,
  authorizeDataExport,
  authorizeSource,
  minimizeAiPayload,
  retentionDisposition,
} from "./index.js";

const admin: ActorContext = {
  actorId: "admin",
  tenantId: "tenant-1",
  roles: ["ADMIN"],
  authenticated: true,
  requestId: "req-1",
};
const owner: ActorContext = { ...admin, roles: ["COMMERCIAL_OWNER"] };

describe("data governance policy", () => {
  it("requires attestation and prevents unapproved connector activation", () => {
    expect(() => authorizeSource("CSV_IMPORT", false)).toThrow(/attestation/i);
    expect(authorizeSource("CSV_IMPORT", true).approvalReference).toBe(
      "DEC-032",
    );
    expect(() => authorizeSource("APPROVED_CONNECTOR", true)).toThrow(
      /disabled/i,
    );
  });
  it("calculates versioned retention review without silently deleting", () => {
    expect(
      retentionDisposition({
        dataClass: "RAW_IMPORT",
        referenceAt: "2026-01-01T00:00:00.000Z",
        asOf: "2026-02-01T00:00:00.000Z",
      }),
    ).toMatchObject({
      policyVersion: "governance/0.1",
      action: "REVIEW_OR_DELETE",
    });
    expect(
      retentionDisposition({
        dataClass: "AUDIT_EVENT",
        referenceAt: "2026-01-01T00:00:00.000Z",
        asOf: "2026-02-01T00:00:00.000Z",
      }).action,
    ).toBe("RETAIN");
  });
  it("restricts export and deletion to admins and creates auditable commands", () => {
    expect(() =>
      authorizeDataExport(owner, { purpose: "Review", filters: {} }),
    ).toThrow(/Forbidden/);
    expect(
      authorizeDataExport(admin, {
        purpose: "Subject request",
        filters: { organizationId: "org-1" },
      }),
    ).toMatchObject({
      action: "DATA_EXPORT_REQUESTED",
      tenantId: "tenant-1",
      policyVersion: "governance/0.1",
    });
    expect(
      authorizeDataDeletion(admin, {
        resourceType: "contact",
        resourceId: "contact-1",
        reason: "Approved request",
      }),
    ).toMatchObject({
      action: "DATA_DELETION_REQUESTED",
      preserveAuditTombstone: true,
    });
  });
  it("removes direct personal and raw fields from AI payloads", () => {
    const payload = minimizeAiPayload({
      operation: "extract",
      contractVersion: "0.2",
      evidence: [
        {
          id: "ev-1",
          type: "interview",
          content: {
            name: "Person",
            email: "person@example.test",
            raw_value: "secret",
            problem: "Planning delay",
          },
        },
      ],
    });
    expect(payload.evidence[0]?.content).toEqual({ problem: "Planning delay" });
  });
});
