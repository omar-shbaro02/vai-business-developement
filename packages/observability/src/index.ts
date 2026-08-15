import pino, { type Logger, type LoggerOptions } from "pino";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "clientSecret",
];

export function createLoggerOptions(options: {
  service: string;
  level?: string;
}): LoggerOptions {
  const loggerOptions: LoggerOptions = {
    base: { service: options.service },
    level: options.level ?? process.env.LOG_LEVEL ?? "info",
    redact: { paths: redactPaths, censor: "[REDACTED]" },
  };

  return loggerOptions;
}

export function createLogger(options: {
  service: string;
  level?: string;
}): Logger {
  return pino(createLoggerOptions(options));
}
