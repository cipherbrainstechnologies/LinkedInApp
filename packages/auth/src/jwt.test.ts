import { describe, expect, it } from "vitest";
import { generateCodeChallenge, generateCodeVerifier, verifyCodeChallenge } from "./pkce.js";
import { signIdToken, verifyIdToken } from "./jwt.js";

describe("pkce", () => {
  it("verifies code challenge", () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    expect(verifyCodeChallenge(verifier, challenge)).toBe(true);
    expect(verifyCodeChallenge(verifier, "wrong")).toBe(false);
  });
});

describe("id token", () => {
  const secret = "test-secret-minimum-32-characters-long";
  const issuer = "http://localhost:4100/oidc";
  const audience = "applyflow-local";

  it("validates issuer audience nonce expiry", async () => {
    const nonce = "nonce-123";
    const token = await signIdToken(secret, issuer, audience, {
      sub: "user-1",
      email: "test@example.com",
      email_verified: true,
      nonce,
    });
    const claims = await verifyIdToken(secret, token, { issuer, audience, nonce });
    expect(claims?.sub).toBe("user-1");
    expect(claims?.email).toBe("test@example.com");
  });

  it("rejects wrong nonce (AUTH-02)", async () => {
    const token = await signIdToken(secret, issuer, audience, {
      sub: "user-1",
      nonce: "real-nonce",
    });
    const claims = await verifyIdToken(secret, token, {
      issuer,
      audience,
      nonce: "wrong-nonce",
    });
    expect(claims).toBeNull();
  });
});
