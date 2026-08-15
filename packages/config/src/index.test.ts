import { describe, expect, it } from "vitest";
import { loadConfig, resetConfigForTests, resolveListenPort } from "./index.js";

describe("config", () => {
  it("loads defaults for local development", () => {
    resetConfigForTests();
    const config = loadConfig({
      NODE_ENV: "development",
      APP_ENV: "local",
      SESSION_SECRET: "local-dev-session-secret-min-32-chars!!",
      JWT_ACCESS_SECRET: "local-dev-jwt-access-secret-min-32!!",
      ENCRYPTION_KEY: "local-dev-encryption-key-32chars!!",
    });
    expect(config.DEMO_AUTH_ENABLED).toBe(true);
    expect(config.API_PORT).toBe(4000);
  });

  it("rejects demo auth in production", () => {
    expect(() =>
      loadConfig({
        APP_ENV: "production",
        DEMO_AUTH_ENABLED: "true",
        SESSION_SECRET: "prod-session-secret-minimum-32-characters",
        JWT_ACCESS_SECRET: "prod-jwt-access-secret-minimum-32-chars",
        ENCRYPTION_KEY: "prod-encryption-key-minimum-32-chars",
      }),
    ).toThrow("DEMO_AUTH_ENABLED");
  });

  it("resolveListenPort prefers Railway PORT", () => {
    const prev = process.env.PORT;
    process.env.PORT = "8080";
    expect(resolveListenPort(4000)).toBe(8080);
    if (prev === undefined) delete process.env.PORT;
    else process.env.PORT = prev;
  });
});
