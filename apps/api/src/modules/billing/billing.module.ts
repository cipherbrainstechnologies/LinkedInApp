import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

@Controller("billing")
@UseGuards(AuthGuard)
class BillingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  @Get("plans")
  async getPlans() {
    const plans = await this.prisma.client.plan.findMany({
      where: { status: "ACTIVE" },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    return {
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        version: p.versions[0],
      })),
    };
  }

  @Get("subscription")
  async getSubscription(@CurrentUserId() userId: string) {
    const sub = await this.prisma.client.subscription.findFirst({
      where: { userId },
      include: { planVersion: { include: { plan: true } } },
    });
    const quota = await this.quota.getQuotaSummary(userId);
    return { subscription: sub, quota };
  }

  @Post("upgrade/preview")
  async previewUpgrade(@CurrentUserId() userId: string, @Body() body: { planVersionId: string }) {
    const target = await this.prisma.client.planVersion.findUniqueOrThrow({
      where: { id: body.planVersionId },
      include: { plan: true },
    });
    const current = await this.prisma.client.subscription.findFirst({
      where: { userId },
      include: { planVersion: true },
    });
    const quota = await this.quota.getQuotaSummary(userId);

    const currentPrice = current?.planVersion?.priceMinor ?? 0;
    const newPrice = target.priceMinor;
    const credit = Math.max(0, currentPrice - 0);
    const dueNow = Math.max(0, newPrice - credit);

    return {
      targetPlan: target.plan.name,
      targetQuota: target.applicationQuota,
      currentUsage: quota.quotaUsed,
      newAvailable: target.applicationQuota - quota.quotaUsed,
      creditMinor: credit,
      dueNowMinor: dueNow,
      currency: target.currency,
      taxMinor: Math.round(dueNow * 0.18),
      nextRenewalAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoteExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  @Post("upgrade/confirm")
  async confirmUpgrade(@CurrentUserId() userId: string, @Body() body: { planVersionId: string }) {
    const target = await this.prisma.client.planVersion.findUniqueOrThrow({
      where: { id: body.planVersionId },
    });

    const payment = await this.prisma.client.paymentTransaction.create({
      data: {
        userId,
        provider: "mock",
        providerTxnId: `mock_${crypto.randomUUID()}`,
        amountMinor: target.priceMinor,
        currency: target.currency,
        state: "PENDING",
        planVersionId: target.id,
      },
    });

    return {
      state: "PROCESSING",
      paymentId: payment.id,
      message: "Payment pending webhook confirmation.",
    };
  }

  @Post("webhooks/mock")
  async mockWebhook(@Body() body: { paymentId: string; event: string }) {
    const payment = await this.prisma.client.paymentTransaction.findUniqueOrThrow({
      where: { id: body.paymentId },
    });

    if (body.event !== "payment.succeeded") {
      return { processed: false };
    }

    await this.prisma.client.paymentTransaction.update({
      where: { id: payment.id },
      data: { state: "SUCCEEDED" },
    });

    if (payment.planVersionId) {
      const planVersion = await this.prisma.client.planVersion.findUniqueOrThrow({
        where: { id: payment.planVersionId },
      });

      await this.prisma.client.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planVersionId: planVersion.id,
          state: "ACTIVE",
          provider: "mock",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          planVersionId: planVersion.id,
          state: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const period = await this.prisma.client.entitlementPeriod.findFirst({
        where: { userId: payment.userId, status: "ACTIVE" },
      });

      if (period) {
        await this.prisma.client.entitlementPeriod.update({
          where: { id: period.id },
          data: { quotaLimit: planVersion.applicationQuota, planVersionId: planVersion.id },
        });

        const additional = planVersion.applicationQuota - period.quotaLimit;
        if (additional > 0) {
          await this.prisma.client.quotaLedgerEntry.create({
            data: {
              userId: payment.userId,
              entitlementPeriodId: period.id,
              entryType: "GRANT",
              units: additional,
              operationKey: `upgrade-grant:${payment.id}`,
              reasonCode: "PLAN_UPGRADE",
              actorType: "SYSTEM",
            },
          });
        }
      }
    }

    await this.prisma.client.webhookEvent.create({
      data: {
        provider: "mock",
        providerEventId: `mock_evt_${payment.id}`,
        signatureVerified: true,
        state: "PROCESSED",
        processedAt: new Date(),
      },
    });

    return { processed: true, state: "ACTIVE" };
  }

  @Post("downgrade")
  async scheduleDowngrade(@CurrentUserId() userId: string, @Body() body: { planVersionId: string }) {
    await this.prisma.client.subscription.updateMany({
      where: { userId },
      data: {
        state: "CHANGE_SCHEDULED",
        scheduledPlanVersionId: body.planVersionId,
        cancelAtPeriodEnd: false,
      },
    });
    const sub = await this.prisma.client.subscription.findFirst({ where: { userId } });
    return {
      scheduled: true,
      effectiveAt: sub?.currentPeriodEnd?.toISOString(),
      message: "Downgrade scheduled for period end. Current quota unchanged until then.",
    };
  }
}

@Module({ controllers: [BillingController] })
export class BillingModule {}
