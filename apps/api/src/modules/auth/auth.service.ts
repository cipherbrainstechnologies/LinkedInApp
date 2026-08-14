import { createHash } from "node:crypto";
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import { createLogger } from "@applyflow/observability";
import { createOidcStartParams, verifyIdToken } from "@applyflow/auth";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";
import { SessionService } from "../../platform/session.service.js";
import { OidcStateService } from "../../platform/oidc-state.service.js";

const logger = createLogger("auth");

export const DEMO_PERSONAS: Record<
  string,
  { label: string; email: string; path: "EXPERIENCED" | "FRESHER"; onboardingState: string }
> = {
  "experienced-free": {
    label: "Experienced (free, incomplete)",
    email: "experienced.free@demo.applyflow.local",
    path: "EXPERIENCED",
    onboardingState: "IN_PROGRESS",
  },
  "experienced-launch": {
    label: "Experienced Launch (paid 50)",
    email: "experienced.launch@demo.applyflow.local",
    path: "EXPERIENCED",
    onboardingState: "COMPLETED",
  },
  "fresher-free": {
    label: "Fresher (free)",
    email: "fresher.free@demo.applyflow.local",
    path: "FRESHER",
    onboardingState: "IN_PROGRESS",
  },
  "quota-exhausted": {
    label: "Quota exhausted",
    email: "quota.exhausted@demo.applyflow.local",
    path: "EXPERIENCED",
    onboardingState: "COMPLETED",
  },
  "waiting-action": {
    label: "Waiting for user action",
    email: "waiting.action@demo.applyflow.local",
    path: "EXPERIENCED",
    onboardingState: "COMPLETED",
  },
};

export type OidcStartResult = {
  authorizationUrl: string;
  state: string;
};

export type OidcCallbackResult =
  | {
      userId: string;
      sessionToken?: string;
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
      needsEmailVerification: boolean;
      returnTo?: string;
    }
  | { error: string; code: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly quota: QuotaService,
    private readonly oidcState: OidcStateService,
  ) {}

  getDemoPersonas() {
    return Object.entries(DEMO_PERSONAS).map(([id, p]) => ({ id, ...p }));
  }

  async startOidc(platform: "web" | "mobile", returnTo?: string): Promise<OidcStartResult> {
    const config = getConfig();
    const redirectUri = config.OIDC_WEB_REDIRECT_URI;
    const params = createOidcStartParams(redirectUri, platform, returnTo);
    await this.oidcState.saveState(params);

    const url = new URL(`${config.OIDC_ISSUER_URL}/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.OIDC_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", params.state);
    url.searchParams.set("nonce", params.nonce);
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return { authorizationUrl: url.toString(), state: params.state };
  }

  async handleOidcCallback(code: string, state: string): Promise<OidcCallbackResult> {
    const stored = await this.oidcState.consumeState(state);
    if (!stored) {
      await this.recordSecurityEvent("OIDC_INVALID_STATE", state);
      throw new UnauthorizedException({
        code: "OIDC_INVALID_STATE",
        message: "Invalid or expired OIDC state.",
      });
    }

    const config = getConfig();
    let tokenResponse: { id_token: string };
    try {
      const res = await fetch(`${config.OIDC_ISSUER_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          code_verifier: stored.codeVerifier,
          redirect_uri: stored.redirectUri,
          client_id: config.OIDC_CLIENT_ID,
          client_secret: config.OIDC_CLIENT_SECRET,
        }),
      });
      if (!res.ok) {
        await this.recordSecurityEvent("OIDC_TOKEN_EXCHANGE_FAILED", state);
        throw new UnauthorizedException({ code: "OIDC_TOKEN_FAILED", message: "Token exchange failed." });
      }
      tokenResponse = (await res.json()) as { id_token: string };
    } catch {
      await this.recordSecurityEvent("OIDC_TOKEN_EXCHANGE_FAILED", state);
      throw new UnauthorizedException({ code: "OIDC_TOKEN_FAILED", message: "Token exchange failed." });
    }

    const claims = await verifyIdToken(config.JWT_ACCESS_SECRET, tokenResponse.id_token, {
      issuer: config.OIDC_ISSUER_URL,
      audience: config.OIDC_CLIENT_ID,
      nonce: stored.nonce,
    });

    if (!claims?.sub) {
      await this.recordSecurityEvent("OIDC_INVALID_TOKEN", state);
      throw new UnauthorizedException({ code: "OIDC_INVALID_TOKEN", message: "Invalid identity token." });
    }

    const provider = "oidc-local";
    const { userId, needsEmailVerification } = await this.linkOidcIdentity({
      provider,
      providerSubject: claims.sub,
      emailClaim: claims.email,
      emailVerified: claims.email_verified === true,
    });

    if (stored.platform === "mobile") {
      const creds = await this.sessions.createMobileCredentials(userId, "oidc-mobile");
      return {
        userId,
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
        expiresIn: creds.expiresIn,
        needsEmailVerification,
        returnTo: stored.returnTo,
      };
    }

    const { token } = await this.sessions.createSession(userId, "oidc-web");
    return {
      userId,
      sessionToken: token,
      needsEmailVerification,
      returnTo: stored.returnTo,
    };
  }

  private async linkOidcIdentity(input: {
    provider: string;
    providerSubject: string;
    emailClaim?: string;
    emailVerified: boolean;
  }): Promise<{ userId: string; needsEmailVerification: boolean }> {
    const existing = await this.prisma.client.userIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: input.provider,
          providerSubject: input.providerSubject,
        },
      },
    });

    if (existing) {
      await this.prisma.client.userIdentity.update({
        where: { id: existing.id },
        data: { lastUsedAt: new Date() },
      });
      const primaryEmail = await this.prisma.client.email.findFirst({
        where: { userId: existing.userId, isPrimary: true, verified: true },
      });
      return {
        userId: existing.userId,
        needsEmailVerification: !primaryEmail,
      };
    }

    const needsEmailVerification = !input.emailClaim || !input.emailVerified;

    const user = await this.prisma.client.user.create({
      data: {
        identities: {
          create: {
            provider: input.provider,
            providerSubject: input.providerSubject,
            emailClaim: input.emailClaim,
            claimVerified: input.emailVerified,
          },
        },
        emails: input.emailClaim && input.emailVerified
          ? {
              create: {
                displayValue: input.emailClaim,
                valueHash: createHash("sha256").update(input.emailClaim.toLowerCase()).digest("hex"),
                verified: true,
                isPrimary: true,
                verifiedAt: new Date(),
              },
            }
          : undefined,
      },
    });

    await this.quota.grantInitialQuota(user.id);
    logger.info("OIDC user created", { userId: user.id, needsEmailVerification });

    return { userId: user.id, needsEmailVerification };
  }

  async startEmailVerification(userId: string, email: string): Promise<{ sent: boolean }> {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException({ code: "INVALID_EMAIL", message: "Invalid email address." });
    }

    const code = this.sessions.generateEmailVerificationCode();
    await this.oidcState.saveEmailVerificationCode(userId, normalized, code);

    logger.info("Email verification code issued", { userId, email: "[REDACTED]" });
    if (getConfig().APP_ENV === "local" || getConfig().APP_ENV === "demo") {
      logger.info("Demo verification code", { userId, code });
    }

    return { sent: true };
  }

  async verifyEmail(userId: string, code: string): Promise<{ verified: boolean }> {
    const payload = await this.oidcState.consumeEmailVerificationCode(code);
    if (!payload || payload.userId !== userId) {
      throw new BadRequestException({ code: "INVALID_CODE", message: "Invalid or expired verification code." });
    }

    const valueHash = createHash("sha256").update(payload.email).digest("hex");

    await this.prisma.client.email.deleteMany({
      where: { userId, isPrimary: true },
    });

    await this.prisma.client.email.create({
      data: {
        userId,
        displayValue: payload.email,
        valueHash,
        verified: true,
        isPrimary: true,
        verifiedAt: new Date(),
      },
    });

    return { verified: true };
  }

  async refreshTokens(refreshToken: string) {
    return this.sessions.rotateRefreshToken(refreshToken);
  }

  async demoLogin(personaId: string): Promise<{ userId: string; token: string }> {
    const config = getConfig();
    if (!config.DEMO_AUTH_ENABLED) {
      throw new UnauthorizedException({ code: "DEMO_AUTH_DISABLED", message: "Demo auth is disabled." });
    }

    const persona = DEMO_PERSONAS[personaId];
    if (!persona) {
      throw new UnauthorizedException({ code: "INVALID_PERSONA", message: "Unknown demo persona." });
    }

    let user = await this.prisma.client.user.findFirst({
      where: { emails: { some: { displayValue: persona.email } } },
    });

    if (!user) {
      user = await this.prisma.client.user.create({
        data: {
          onboardingPath: persona.path,
          onboardingState: persona.onboardingState,
          emails: {
            create: {
              displayValue: persona.email,
              valueHash: persona.email,
              verified: true,
              isPrimary: true,
              verifiedAt: new Date(),
            },
          },
          identities: {
            create: {
              provider: "demo",
              providerSubject: personaId,
              emailClaim: persona.email,
              claimVerified: true,
            },
          },
        },
      });
      await this.quota.grantInitialQuota(user.id);
    }

    const { token } = await this.sessions.createSession(user.id, `demo:${personaId}`);
    logger.info("Demo login", { userId: user.id, personaId });
    return { userId: user.id, token };
  }

  async logout(token: string): Promise<void> {
    const hash = this.sessions.hashToken(token);
    const session = await this.prisma.client.session.findFirst({ where: { tokenHash: hash } });
    if (session) {
      await this.sessions.revokeSession(session.id);
    }
  }

  async listSessions(userId: string) {
    return this.sessions.listSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.client.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new BadRequestException({ code: "SESSION_NOT_FOUND", message: "Session not found." });
    }
    await this.sessions.revokeSession(sessionId);
  }

  private async recordSecurityEvent(action: string, state: string): Promise<void> {
    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "SYSTEM",
        action,
        targetType: "OIDC_STATE",
        metadata: { statePrefix: state.slice(0, 8) },
        outcome: "FAILURE",
      },
    });
    logger.warn("OIDC security event", { action });
  }
}
