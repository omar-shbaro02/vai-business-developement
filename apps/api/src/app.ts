import { type ActorContext, authorize } from "@vai/auth";
import { createLoggerOptions } from "@vai/observability";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { z, ZodError } from "zod";

export interface Page<T> {
  data: T[];
  page: { cursor: string | null; has_more: boolean };
}
export interface ApiServices {
  listOrganizations(
    actor: ActorContext,
    query: { cursor: string | null; limit: number; filter: string | null },
  ): Promise<Page<unknown>>;
  listOpportunities(
    actor: ActorContext,
    query: { cursor: string | null; limit: number; filter: string | null },
  ): Promise<Page<unknown>>;
  getEvidence(actor: ActorContext, id: string): Promise<unknown | null>;
  history(
    actor: ActorContext,
    resourceType: string,
    resourceId: string,
  ): Promise<unknown[]>;
  recordDecision(input: {
    tenantId: string;
    opportunityId: string;
    systemPriorityDecisionId: string;
    decision: "ACCEPT" | "REJECT" | "DEFER" | "OVERRIDE";
    previousState: Record<string, unknown>;
    selectedState: Record<string, unknown>;
    reason: string | null;
    supportingEvidenceIds: string[];
    actor: ActorContext;
  }): Promise<{ id: string; decidedAt: string }>;
}
export interface ApiOptions {
  resolveActor?(request: FastifyRequest): Promise<ActorContext> | ActorContext;
  services?: ApiServices;
  rateLimit?: { max: number; windowMs: number };
}
class RateLimitError extends Error {}
const unavailable = async (): Promise<never> => {
  throw new Error("Service unavailable");
};
const defaultServices: ApiServices = {
  listOrganizations: unavailable,
  listOpportunities: unavailable,
  getEvidence: unavailable,
  history: unavailable,
  recordDecision: unavailable,
};
const pageQuery = z
  .object({
    cursor: z.string().min(1).nullable().default(null),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    filter: z.string().min(1).nullable().default(null),
  })
  .strict();
const idParams = z.object({ id: z.string().min(1) }).strict();
const historyParams = z
  .object({ resourceType: z.string().min(1), resourceId: z.string().min(1) })
  .strict();
const decisionBody = z
  .object({
    system_priority_decision_id: z.string().min(1),
    decision: z.enum(["ACCEPT", "REJECT", "DEFER", "OVERRIDE"]),
    previous_state: z.record(z.string(), z.unknown()),
    selected_state: z.record(z.string(), z.unknown()),
    reason: z.string().min(1).nullable(),
    supporting_evidence_ids: z.array(z.string().min(1)).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.decision === "OVERRIDE" && !value.reason?.trim())
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Override reason is required",
      });
  });

export function createApp(options: ApiOptions = {}): FastifyInstance {
  const app = Fastify({ logger: createLoggerOptions({ service: "api" }) }),
    services = options.services ?? defaultServices,
    rateLimit = options.rateLimit ?? { max: 120, windowMs: 60_000 },
    requests = new Map<string, { count: number; resetsAt: number }>();
  const actor = async (request: FastifyRequest) => {
    if (!options.resolveActor) throw new Error("Unauthenticated actor context");
    return options.resolveActor(request);
  };
  app.setErrorHandler((error, request, reply) => {
    let status = 500,
      code = "INTERNAL_ERROR",
      message = "An internal error occurred";
    const errorMessage = error instanceof Error ? error.message : "";
    if (error instanceof ZodError) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = "Request validation failed";
    } else if (error instanceof RateLimitError) {
      status = 429;
      code = "RATE_LIMITED";
      message = "Too many requests";
    } else if (errorMessage.includes("Unauthenticated")) {
      status = 401;
      code = "UNAUTHENTICATED";
      message = "Authentication is required";
    } else if (
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("Cross-tenant")
    ) {
      status = 403;
      code = "FORBIDDEN";
      message = "You are not authorized for this operation";
    } else if (errorMessage.includes("not found")) {
      status = 404;
      code = "NOT_FOUND";
      message = "The requested resource was not found";
    }
    reply.status(status).send({
      error: {
        code,
        message,
        request_id: request.id,
        details:
          error instanceof ZodError
            ? error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              }))
            : [],
      },
    });
  });
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/v1/")) return;
    const now = Date.now(),
      key = request.ip,
      current = requests.get(key);
    if (!current || current.resetsAt <= now) {
      requests.set(key, { count: 1, resetsAt: now + rateLimit.windowMs });
      return;
    }
    current.count += 1;
    if (current.count > rateLimit.max) {
      reply.header(
        "retry-after",
        Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
      );
      throw new RateLimitError("Rate limit exceeded");
    }
    if (requests.size > 10_000)
      for (const [candidate, value] of requests)
        if (value.resetsAt <= now) requests.delete(candidate);
  });
  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    if (request.url.startsWith("/v1/"))
      reply.header("cache-control", "no-store");
    return payload;
  });
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async () => ({ status: "ready" }));
  app.get("/v1/organizations", async (request) => {
    const context = await actor(request);
    authorize(context, "governed:read");
    return services.listOrganizations(context, pageQuery.parse(request.query));
  });
  app.get("/v1/opportunities", async (request) => {
    const context = await actor(request);
    authorize(context, "governed:read");
    return services.listOpportunities(context, pageQuery.parse(request.query));
  });
  app.get("/v1/evidence/:id", async (request) => {
    const context = await actor(request);
    authorize(context, "governed:read");
    const { id } = idParams.parse(request.params),
      value = await services.getEvidence(context, id);
    if (!value) throw new Error("Evidence not found");
    return { data: value };
  });
  app.get("/v1/history/:resourceType/:resourceId", async (request) => {
    const context = await actor(request);
    authorize(context, "governed:read");
    const params = historyParams.parse(request.params);
    return {
      data: await services.history(
        context,
        params.resourceType,
        params.resourceId,
      ),
    };
  });
  app.post("/v1/opportunities/:id/decisions", async (request, reply) => {
    const context = await actor(request),
      { id } = idParams.parse(request.params),
      body = decisionBody.parse(request.body);
    authorize(
      context,
      body.decision === "OVERRIDE" ? "priority:override" : "pursuit:approve",
    );
    const value = await services.recordDecision({
      tenantId: context.tenantId,
      opportunityId: id,
      systemPriorityDecisionId: body.system_priority_decision_id,
      decision: body.decision,
      previousState: body.previous_state,
      selectedState: body.selected_state,
      reason: body.reason,
      supportingEvidenceIds: body.supporting_evidence_ids,
      actor: context,
    });
    return reply
      .status(201)
      .send({ data: { id: value.id, decided_at: value.decidedAt } });
  });
  return app;
}
