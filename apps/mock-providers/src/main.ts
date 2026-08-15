import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { randomBytes } from "node:crypto";
import { getConfig } from "@applyflow/config";
import { signIdToken, verifyCodeChallenge } from "@applyflow/auth";

const config = getConfig();

async function main() {
  const app = Fastify({ logger: true });
  await app.register(formbody);

type PendingAuth = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  nonce: string;
  codeChallenge: string;
};

const pendingCodes = new Map<string, PendingAuth>();

const PERSONAS = [
  { id: "with-email", sub: "oidc-with-email", email: "oidc.user@demo.applyflow.local", email_verified: true },
  { id: "no-email", sub: "oidc-no-email" },
];

app.get("/health", async () => ({ status: "ok", service: "mock-providers" }));

app.get("/oidc/authorize", async (req, reply) => {
  const q = req.query as Record<string, string>;
  const state = q.state;
  const nonce = q.nonce;
  const redirectUri = q.redirect_uri;
  const challenge = q.code_challenge;

  if (!state || !nonce || !redirectUri || !challenge) {
    return reply.status(400).send({ error: "invalid_request" });
  }

  const html = `
    <html><body style="font-family:system-ui;padding:2rem">
      <h1>Mock OIDC Sign-in</h1>
      <p>Select a persona (local demo only)</p>
      ${PERSONAS.map(
        (p) =>
          `<form method="POST" action="/oidc/authorize/submit" style="margin:1rem 0">
            <input type="hidden" name="state" value="${state}" />
            <input type="hidden" name="nonce" value="${nonce}" />
            <input type="hidden" name="redirect_uri" value="${redirectUri}" />
            <input type="hidden" name="code_challenge" value="${challenge}" />
            <input type="hidden" name="sub" value="${p.sub}" />
            <input type="hidden" name="email" value="${p.email ?? ""}" />
            <input type="hidden" name="email_verified" value="${p.email_verified ? "1" : "0"}" />
            <button type="submit">${p.id}${p.email ? ` (${p.email})` : " (no email)"}</button>
          </form>`,
      ).join("")}
    </body></html>`;
  return reply.type("text/html").send(html);
});

app.post("/oidc/authorize/submit", async (req, reply) => {
  const body = req.body as Record<string, string>;
  const code = randomBytes(16).toString("base64url");
  pendingCodes.set(code, {
    sub: body.sub,
    email: body.email || undefined,
    email_verified: body.email_verified === "1",
    nonce: body.nonce,
    codeChallenge: body.code_challenge,
  });
  const url = new URL(body.redirect_uri);
  url.searchParams.set("code", code);
  url.searchParams.set("state", body.state);
  return reply.redirect(url.toString(), 302);
});

app.post("/oidc/token", async (req, reply) => {
  const body = req.body as Record<string, string>;
  if (body.grant_type !== "authorization_code") {
    return reply.status(400).send({ error: "unsupported_grant_type" });
  }

  const entry = pendingCodes.get(body.code);
  if (!entry) {
    return reply.status(400).send({ error: "invalid_grant" });
  }

  if (!body.code_verifier || !verifyCodeChallenge(body.code_verifier, entry.codeChallenge)) {
    return reply.status(400).send({ error: "invalid_grant", message: "PKCE verification failed" });
  }

  pendingCodes.delete(body.code);

  const idToken = await signIdToken(
    config.JWT_ACCESS_SECRET,
    config.OIDC_ISSUER_URL,
    config.OIDC_CLIENT_ID,
    {
      sub: entry.sub,
      email: entry.email,
      email_verified: entry.email_verified,
      nonce: entry.nonce,
    },
  );

  return {
    access_token: randomBytes(16).toString("base64url"),
    token_type: "Bearer",
    id_token: idToken,
  };
});

app.get("/", async () => ({
  message: "ApplyFlow Mock Providers",
  oidc: `${config.OIDC_ISSUER_URL}/authorize`,
}));

app.listen({ port: config.MOCK_PROVIDERS_PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
