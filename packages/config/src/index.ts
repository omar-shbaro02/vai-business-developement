import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z
    .enum(["development", "test", "pilot", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const apiSchema = baseSchema
  .extend({
    HOST: z.string().min(1).default("127.0.0.1"),
    API_PORT: z.coerce.number().int().positive().max(65535).default(4000),
    AUTH_MODE: z.enum(["oidc", "development"]).default("development"),
    OIDC_ISSUER_URL: z.url().optional(),
    OIDC_CLIENT_ID: z.string().min(1).optional(),
  })
  .superRefine((config, context) => {
    if (
      (config.APP_ENV === "pilot" || config.APP_ENV === "production") &&
      config.AUTH_MODE !== "oidc"
    ) {
      context.addIssue({
        code: "custom",
        message: "Pilot and production require OIDC authentication",
        path: ["AUTH_MODE"],
      });
    }
    if (
      config.AUTH_MODE === "oidc" &&
      (!config.OIDC_ISSUER_URL || !config.OIDC_CLIENT_ID)
    ) {
      context.addIssue({
        code: "custom",
        message: "OIDC issuer and client ID are required",
        path: ["OIDC_ISSUER_URL"],
      });
    }
  });

export type ApiConfig = z.infer<typeof apiSchema>;
export type WorkerConfig = z.infer<typeof baseSchema>;
type Environment = Record<string, string | undefined>;

export function loadApiConfig(environment: Environment): ApiConfig {
  return apiSchema.parse(environment);
}

export function loadWorkerConfig(environment: Environment): WorkerConfig {
  return baseSchema.parse(environment);
}
