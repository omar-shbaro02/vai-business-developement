import { describe, expect, it } from "vitest";
import {
  accessPathSchema,
  evidenceSchema,
  humanDecisionSchema,
  importResultSchema,
  prospectSearchRequestSchema,
  prospectSearchResultSchema,
  signalSchema,
} from "./index.js";

const time = "2026-08-15T00:00:00.000Z";

describe("output schemas", () => {
  it("rejects invalid enum values", () => {
    const result = evidenceSchema.safeParse({
      schema_version: "0.2",
      id: "ev_1",
      tenant_id: "tenant_1",
      organization_id: "org_1",
      opportunity_id: null,
      source: {
        type: "MANUAL",
        reference: null,
        source_record_id: null,
        import_id: null,
      },
      captured_at: time,
      observed_at: null,
      evidence_type: "WEBSITE",
      raw_value: {},
      normalized_value: null,
      confidence: "CERTAIN",
      freshness: "CURRENT",
      verification_status: "RAW",
      review_notes: null,
      created_by: "user_1",
      supersedes_evidence_id: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported AI inference without evidence", () => {
    const result = signalSchema.safeParse({
      schema_version: "0.2",
      id: "sig_1",
      tenant_id: "tenant_1",
      organization_id: "org_1",
      opportunity_id: null,
      kind: "AI_INFERENCE",
      type: "SUMMARY",
      value: {},
      evidence_ids: [],
      derivation: {
        rule_version: null,
        provider: "provider",
        model: "model",
        contract_version: "1",
        generated_at: time,
        validation_status: "VALID",
      },
      created_at: time,
    });
    expect(result.success).toBe(false);
  });

  it("requires evidence for medium or high access", () => {
    expect(
      accessPathSchema.safeParse({
        id: "access_1",
        type: "REFERRAL",
        strength: "HIGH",
        target_persona: null,
        known_contact_id: "contact_1",
        evidence_ids: [],
        review_status: "REVIEWED",
      }).success,
    ).toBe(false);
  });

  it("requires a human override reason", () => {
    expect(
      humanDecisionSchema.safeParse({
        schema_version: "0.2",
        id: "hd_1",
        opportunity_id: "opp_1",
        system_priority_decision_id: "pd_1",
        decision: "OVERRIDE",
        previous_state: {},
        selected_state: {},
        reason: null,
        supporting_evidence_ids: [],
        decided_by: "user_1",
        decided_at: time,
      }).success,
    ).toBe(false);
  });

  it("validates import row accounting", () => {
    expect(
      importResultSchema.safeParse({
        schema_version: "0.2",
        import_id: "import_1",
        status: "COMPLETED",
        row_count: 10,
        accepted_count: 9,
        rejected_count: 0,
        duplicate_candidate_count: 0,
        errors: [],
        created_by: "user_1",
        created_at: time,
        completed_at: time,
      }).success,
    ).toBe(false);
  });

  it("requires both industry and region for prospect search", () => {
    expect(
      prospectSearchRequestSchema.safeParse({ industry: "Distribution" })
        .success,
    ).toBe(false);
  });

  it("requires visible tier rationale and a human-reviewed strategy", () => {
    expect(
      prospectSearchResultSchema.safeParse({
        organization_id: "org_1",
        legal_name: "Example Distribution LLC",
        display_name: "Example Distribution",
        website: "https://example.test",
        industry: "Distribution",
        locations: [
          { country: "US", region: "Virginia", locality: "Arlington" },
        ],
        tier: "TIER_2",
        tier_rule_version: "account-tier/draft-0.1",
        tier_reasons: ["Multi-location regional operation"],
        evidence_ids: ["ev_1"],
        strategy: {
          positioning: "Lead with planning reliability",
          target_roles: ["COO"],
          opening_angle: "Discuss multi-site planning complexity",
          recommended_offer: "Planning diagnostic",
          next_action: "Validate the operating problem",
          evidence_gaps: [],
          requires_human_approval: true,
        },
      }).success,
    ).toBe(true);
  });
});
