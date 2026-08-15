import Fastify, { type FastifyInstance } from "fastify";
import { createLoggerOptions } from "@vai/observability";

export function createApp(): FastifyInstance {
  const app = Fastify({ logger: createLoggerOptions({ service: "api" }) });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async () => ({ status: "ready" }));

  return app;
}
