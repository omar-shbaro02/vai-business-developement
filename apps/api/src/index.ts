import { loadApiConfig } from "@vai/config";
import { createApp } from "./app.js";

const config = loadApiConfig(process.env);
const app = createApp();

try {
  await app.listen({ host: config.HOST, port: config.API_PORT });
} catch (error) {
  app.log.error({ err: error }, "API startup failed");
  process.exitCode = 1;
}
