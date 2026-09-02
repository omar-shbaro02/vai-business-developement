import { afterEach, describe, expect, it } from "vitest";
import type { ActorContext } from "@vai/auth";
import { createApp } from "./app.js";

const apps: ReturnType<typeof createApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("API health", () => {
  it("returns an operational health response", async () => {
    const app = createApp();
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

const owner: ActorContext = {
  actorId: "actor",
  tenantId: "tenant",
  roles: ["COMMERCIAL_OWNER"],
  authenticated: true,
  requestId: "request",
};
const reader: ActorContext = { ...owner, roles: ["READ_ONLY"] };
function services() {
  return {
    async listOrganizations(
      _actor: ActorContext,
      query: { cursor: string | null; limit: number; filter: string | null },
    ) {
      return {
        data: [{ id: "org-1", filter: query.filter }],
        page: { cursor: "org-1", has_more: false },
      };
    },
    async listOpportunities() {
      return { data: [], page: { cursor: null, has_more: false } };
    },
    async getEvidence() {
      return { id: "ev-1", source: { reference: "source" } };
    },
    async history() {
      return [{ action: "UPDATED" }];
    },
    async recordDecision() {
      return { id: "human-1", decidedAt: "2026-08-31T10:00:00.000Z" };
    },
  };
}

describe("domain API", () => {
  it("returns contract pagination and applies typed filters", async () => {
    const app = createApp({ resolveActor: () => reader, services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/organizations?limit=10&filter=example",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [{ id: "org-1", filter: "example" }],
      page: { cursor: "org-1", has_more: false },
    });
  });
  it("rejects unauthenticated access with the safe error envelope", async () => {
    const app = createApp({ services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/opportunities",
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required",
        details: [],
      },
    });
  });
  it("returns explicit validation errors", async () => {
    const app = createApp({ resolveActor: () => reader, services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/organizations?limit=1000",
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });
  it("exposes authorized audit history", async () => {
    const app = createApp({ resolveActor: () => reader, services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/history/opportunity/opp-1",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [{ action: "UPDATED" }] });
  });
  it("requires override reason and owner capability", async () => {
    const app = createApp({ resolveActor: () => owner, services: services() });
    apps.push(app);
    const invalid = await app.inject({
      method: "POST",
      url: "/v1/opportunities/opp-1/decisions",
      payload: {
        system_priority_decision_id: "decision-1",
        decision: "OVERRIDE",
        previous_state: { priority: "P2" },
        selected_state: { priority: "P1" },
        reason: null,
      },
    });
    expect(invalid.statusCode).toBe(400);
    const valid = await app.inject({
      method: "POST",
      url: "/v1/opportunities/opp-1/decisions",
      payload: {
        system_priority_decision_id: "decision-1",
        decision: "OVERRIDE",
        previous_state: { priority: "P2" },
        selected_state: { priority: "P1" },
        reason: "Commercial owner judgment",
        supporting_evidence_ids: ["ev-1"],
      },
    });
    expect(valid.statusCode).toBe(201);
    expect(valid.json()).toEqual({
      data: { id: "human-1", decided_at: "2026-08-31T10:00:00.000Z" },
    });
  });
  it("denies overrides to read-only users", async () => {
    const app = createApp({ resolveActor: () => reader, services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "POST",
      url: "/v1/opportunities/opp-1/decisions",
      payload: {
        system_priority_decision_id: "decision-1",
        decision: "OVERRIDE",
        previous_state: {},
        selected_state: {},
        reason: "no authority",
      },
    });
    expect(response.statusCode).toBe(403);
  });
  it("rate limits protected routes with a safe error and retry guidance", async () => {
    const app = createApp({
      resolveActor: () => reader,
      services: services(),
      rateLimit: { max: 1, windowMs: 60_000 },
    });
    apps.push(app);
    const first = await app.inject({ method: "GET", url: "/v1/opportunities" });
    const limited = await app.inject({
      method: "GET",
      url: "/v1/opportunities",
    });
    expect(first.statusCode).toBe(200);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBe("60");
    expect(limited.json()).toMatchObject({
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
  });
  it("sets defensive response headers and prevents API caching", async () => {
    const app = createApp({ resolveActor: () => reader, services: services() });
    apps.push(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/opportunities",
    });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["cache-control"]).toBe("no-store");
  });
});
