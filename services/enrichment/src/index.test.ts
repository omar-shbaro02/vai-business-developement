import { describe, expect, it } from "vitest";
import {
  extractDeterministicSignals,
  normalizeAccountProfile,
  runBoundedAiExtraction,
  type EvidenceFact,
} from "./index.js";

const facts: EvidenceFact[] = [
  {
    id: "ev-industry",
    type: "INDUSTRY",
    normalizedValue: { code: "541611", label: "Consulting" },
    freshness: "CURRENT",
    verificationStatus: "VERIFIED",
  },
  {
    id: "ev-growth",
    type: "EMPLOYEE_GROWTH",
    normalizedValue: { growth_percent: 18 },
    freshness: "AGING",
    verificationStatus: "REVIEWED",
  },
];
describe("enrichment", () => {
  it("keeps missing profile fields unknown and exposes evidence freshness", () => {
    const profile = normalizeAccountProfile(
      {
        organizationId: "org",
        legalName: "Example LLC",
        displayName: "Example",
        domains: ["example.com"],
      },
      facts,
    );
    expect(profile).toMatchObject({
      website: null,
      locations: [],
      industry: {
        code: "541611",
        label: "Consulting",
        evidenceIds: ["ev-industry"],
      },
      sizeContext: null,
      freshness: "CURRENT",
    });
  });
  it("extracts deterministic signals with supporting evidence", () => {
    expect(extractDeterministicSignals(facts)).toEqual([
      expect.objectContaining({
        kind: "DETERMINISTIC_SIGNAL",
        type: "EMPLOYEE_GROWTH",
        evidenceIds: ["ev-growth"],
      }),
    ]);
  });
  it("labels validated AI output and retains model/contract provenance", async () => {
    const result = await runBoundedAiExtraction(
      {
        name: "test-provider",
        model: "test-model",
        async extract() {
          return {
            claims: [
              {
                type: "EXPANSION",
                value: { active: true },
                evidenceIds: ["ev-1"],
              },
            ],
          };
        },
      },
      {
        operation: "extract-signals",
        contractVersion: "ai-signals/0.1",
        evidence: [
          { id: "ev-1", type: "NEWS", content: "minimal approved content" },
        ],
      },
    );
    expect(result).toMatchObject({
      ok: true,
      signals: [
        {
          kind: "AI_INFERENCE",
          evidenceIds: ["ev-1"],
          derivation: {
            provider: "test-provider",
            model: "test-model",
            contractVersion: "ai-signals/0.1",
            validationStatus: "VALID",
          },
        },
      ],
    });
  });
  it("falls back safely on provider failure and rejects unsupported claims", async () => {
    const input = {
      operation: "extract",
      contractVersion: "v1",
      evidence: [{ id: "ev-1", type: "NEWS", content: "text" }],
    };
    expect(
      await runBoundedAiExtraction(
        {
          name: "p",
          model: "m",
          async extract() {
            throw new Error("outage");
          },
        },
        input,
      ),
    ).toEqual({ ok: false, code: "PROVIDER_FAILURE", signals: [] });
    expect(
      await runBoundedAiExtraction(
        {
          name: "p",
          model: "m",
          async extract() {
            return {
              claims: [
                { type: "BUDGET", value: true, evidenceIds: ["hallucinated"] },
              ],
            };
          },
        },
        input,
      ),
    ).toEqual({ ok: false, code: "INVALID_OUTPUT", signals: [] });
  });
  it("keeps AI disabled when no approved provider is configured", async () => {
    expect(
      await runBoundedAiExtraction(null, {
        operation: "extract",
        contractVersion: "v1",
        evidence: [],
      }),
    ).toEqual({ ok: false, code: "DISABLED", signals: [] });
  });
});
