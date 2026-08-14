import { Injectable, UnauthorizedException } from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import { createLogger } from "@applyflow/observability";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";
import { SessionService } from "../../platform/session.service.js";

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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly quota: QuotaService,
  ) {}

  getDemoPersonas() {
    return Object.entries(DEMO_PERSONAS).map(([id, p]) => ({ id, ...p }));
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
}
