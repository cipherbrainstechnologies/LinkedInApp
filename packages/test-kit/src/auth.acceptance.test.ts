import { describe, expect, it } from "vitest";
import { signIdToken, verifyIdToken } from "@applyflow/auth";

describe("AUTH-02 OIDC validation", () => {
  const secret = "local-dev-jwt-access-secret-min-32!!";
  const issuer = "http://localhost:4100/oidc";
  const audience = "applyflow-local";

  it("rejects invalid nonce", async () => {
    const token = await signIdToken(secret, issuer, audience, {
      sub: "sub-1",
      nonce: "correct-nonce",
    });
    const claims = await verifyIdToken(secret, token, {
      issuer,
      audience,
      nonce: "wrong-nonce",
    });
    expect(claims).toBeNull();
  });

  it("rejects wrong issuer", async () => {
    const nonce = "n1";
    const token = await signIdToken(secret, issuer, audience, { sub: "sub-1", nonce });
    const claims = await verifyIdToken(secret, token, {
      issuer: "http://evil.example/oidc",
      audience,
      nonce,
    });
    expect(claims).toBeNull();
  });
});
