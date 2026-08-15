import { loadWorkerConfig } from "@vai/config";
import { createLogger } from "@vai/observability";

const config = loadWorkerConfig(process.env);
const logger = createLogger({ service: "worker", level: config.LOG_LEVEL });

logger.info({ appEnv: config.APP_ENV }, "Worker foundation initialized");
