import { Controller, Get, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

@Controller("me")
@UseGuards(AuthGuard)
class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  @Get()
  async getMe(@CurrentUserId() userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        emails: { where: { isPrimary: true }, take: 1 },
        subscriptions: { include: { planVersion: { include: { plan: true } } }, take: 1 },
      },
    });

    const primaryEmail = user.emails[0];
    const quotaSummary = await this.quota.getQuotaSummary(userId);
    const subscription = user.subscriptions[0];
    const planName = subscription?.planVersion?.plan?.name ?? "Free";

    return {
      id: user.id,
      status: user.status,
      email: primaryEmail?.displayValue ?? null,
      emailVerified: primaryEmail?.verified ?? false,
      locale: user.locale,
      timeZone: user.timeZone,
      onboardingPath: user.onboardingPath,
      onboardingState: user.onboardingState,
      planSummary: {
        planName,
        quotaUsed: quotaSummary.quotaUsed,
        quotaLimit: quotaSummary.quotaLimit,
        quotaAvailable: quotaSummary.quotaAvailable,
        resetAt: quotaSummary.resetAt?.toISOString() ?? null,
      },
    };
  }
}

@Module({ controllers: [MeController] })
export class MeModule {}
