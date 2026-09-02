import { describe, expect, it } from "vitest";
import {
  detectDuplicateOrganizations,
  normalizeDomain,
  normalizeOrganizationName,
} from "./index.js";

describe("organization identity", () => {
  it("normalizes legal suffixes and domains deterministically", () => {
    expect(normalizeOrganizationName("VAI & Company, LLC")).toBe("vai and");
    expect(normalizeDomain("HTTPS://WWW.Example.COM/about")).toBe(
      "example.com",
    );
  });

  it("detects candidates but never chooses or merges a canonical organization", () => {
    const candidates = detectDuplicateOrganizations([
      {
        id: "org_1",
        legalName: "Example LLC",
        displayName: "Example",
        domains: ["example.com"],
      },
      {
        id: "org_2",
        legalName: "Example Limited",
        displayName: "Example Group",
        domains: ["www.example.com"],
      },
      {
        id: "org_3",
        legalName: "Different SAL",
        displayName: "Different",
        domains: ["different.test"],
      },
    ]);
    expect(candidates).toEqual([
      expect.objectContaining({
        sourceOrganizationId: "org_1",
        targetOrganizationId: "org_2",
        score: 1,
      }),
    ]);
  });
});
