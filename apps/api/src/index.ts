import type { ActorContext } from "@vai/auth";
import { loadApiConfig } from "@vai/config";
import { createDatabase, ProspectSearchStore } from "@vai/database";
import { createApp } from "./app.js";
import { createProspectSearchService } from "./prospect-search-service.js";

const config = loadApiConfig(process.env);
const database = createDatabase(config.DATABASE_URL);
const prospectSearch = new ProspectSearchStore(database.pool);
const developmentActor: ActorContext = {
  actorId: "00000000-0000-4000-8000-000000000002",
  tenantId: "00000000-0000-4000-8000-000000000001",
  roles: ["COMMERCIAL_OWNER"],
  authenticated: true,
  requestId: "development",
};
const app = createApp({
  ...(config.AUTH_MODE === "development"
    ? { resolveActor: () => developmentActor }
    : {}),
  services: { searchProspects: createProspectSearchService(prospectSearch) },
});

app.addHook("onClose", async () => database.close());

try {
  await app.listen({ host: config.HOST, port: config.API_PORT });
} catch (error) {
  app.log.error({ err: error }, "API startup failed");
  process.exitCode = 1;
}
