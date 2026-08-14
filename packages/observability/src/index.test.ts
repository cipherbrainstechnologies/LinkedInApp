import { describe, expect, it } from "vitest";
import { redactObject } from "./index.js";

describe("redactObject", () => {
  it("redacts sensitive keys", () => {
    const result = redactObject({
      userId: "u1",
      accessToken: "secret-token",
      email: "test@example.com",
      operationId: "op-1",
    });
    expect(result.userId).toBe("u1");
    expect(result.accessToken).toBe("[REDACTED]");
    expect(result.email).toBe("[REDACTED]");
    expect(result.operationId).toBe("op-1");
  });
});
