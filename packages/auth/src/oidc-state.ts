import { randomBytes } from "node:crypto";
import { generateCodeChallenge } from "./pkce.js";

export type OidcStartParams = {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
  returnTo?: string;
  platform: "web" | "mobile";
  createdAt: number;
};

export function createOidcStartParams(
  redirectUri: string,
  platform: "web" | "mobile",
  returnTo?: string,
): OidcStartParams {
  const codeVerifier = randomBytes(32).toString("base64url");
  const state = randomBytes(16).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return {
    state,
    nonce,
    codeVerifier,
    codeChallenge,
    redirectUri,
    returnTo,
    platform,
    createdAt: Date.now(),
  };
}

export const OIDC_STATE_TTL_MS = 10 * 60 * 1000;
