import { randomUUID } from "node:crypto";
import { getConfig } from "@applyflow/config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  traceId?: string;
  correlationId?: string;
  userId?: string;
  operationId?: string;
  [key: string]: unknown;
};

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /resume/i,
  /answer/i,
  /email/i,
  /phone/i,
];

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
    return "[REDACTED]";
  }
  if (typeof value === "object" && value !== null) {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = redactValue(key, value);
  }
  return result;
}

export function createTraceId(): string {
  return randomUUID();
}

export function createLogger(name: string) {
  const config = getConfig();

  const log = (level: LogLevel, message: string, context?: LogContext) => {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    if (levels.indexOf(level) < levels.indexOf(config.LOG_LEVEL)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      name,
      message,
      ...redactObject(context ?? {}),
    };

    const line = JSON.stringify(entry);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  };

  return {
    debug: (message: string, context?: LogContext) => log("debug", message, context),
    info: (message: string, context?: LogContext) => log("info", message, context),
    warn: (message: string, context?: LogContext) => log("warn", message, context),
    error: (message: string, context?: LogContext) => log("error", message, context),
  };
}
