import { Injectable } from "@nestjs/common";
import { calculateUpgradeProration, calculateUpgradeQuota } from "@applyflow/domain";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

const QUOTE_TTL_MS = 15 * 60 * 1000;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

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

  async getSubscription(userId: string) {
    const sub = await this.prisma.client.subscription.findFirst({
      where: { userId },
      include: { planVersion: { include: { plan: true } } },
    });
    const quota = await this.quota.getQuotaSummary(userId);
    const pendingPayment = await this.prisma.client.paymentTransaction.findFirst({
      where: { userId, state: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    return { subscription: sub, quota, pendingPayment };
  }

  async previewUpgrade(userId: string, planVersionId: string) {
    const target = await this.prisma.client.planVersion.findUniqueOrThrow({
      where: { id: planVersionId },
      include: { plan: true },
    });
    const currentSub = await this.prisma.client.subscription.findFirst({
      where: { userId },
      include: { planVersion: true },
    });
    const quota = await this.quota.getQuotaSummary(userId);
    const entries = await this.quota.getLedgerEntries(userId);
    const reserved = entries
      .filter((e) => e.entryType === "RESERVE")
      .reduce((sum, e) => sum + e.units, 0)
      - entries
          .filter((e) => e.entryType === "RELEASE")
          .reduce((sum, e) => sum + e.units, 0);

    const periodStart = currentSub?.currentPeriodStart ?? new Date();
    const periodEnd = currentSub?.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const effectiveAt = new Date();

    const proration = calculateUpgradeProration({
      periodStartMs: periodStart.getTime(),
      periodEndMs: periodEnd.getTime(),
      effectiveAtMs: effectiveAt.getTime(),
      oldPriceMinor: currentSub?.planVersion?.priceMinor ?? 0,
      newPriceMinor: target.priceMinor,
    });

    const currentLimit = quota.quotaLimit;
    const quotaProjection = calculateUpgradeQuota({
      currentLimit,
      newLimit: target.applicationQuota,
      quotaUsed: quota.quotaUsed,
      quotaReserved: Math.max(0, reserved),
    });

    const quoteExpiresAt = new Date(Date.now() + QUOTE_TTL_MS);

    return {
      quoteId: `mock_quote_${planVersionId}_${effectiveAt.getTime()}`,
      targetPlan: target.plan.name,
      targetPlanSlug: target.plan.slug,
      targetQuota: target.applicationQuota,
      currentPlan: currentSub?.planVersion ? undefined : "Free",
      currentQuota: currentLimit,
      currentUsage: quota.quotaUsed,
      quotaReserved: quotaProjection.quotaReserved,
      quotaDelta: quotaProjection.quotaDelta,
      newAvailable: quotaProjection.newAvailable,
      creditMinor: proration.unusedOldCreditMinor,
      remainingPeriodChargeMinor: proration.remainingNewChargeMinor,
      subtotalDueMinor: proration.subtotalDueMinor,
      dueNowMinor: proration.dueNowMinor,
      currency: target.currency,
      taxMinor: proration.taxMinor,
      nextRenewalMinor: proration.nextRenewalMinor,
      nextRenewalAt: periodEnd.toISOString(),
      periodStartAt: periodStart.toISOString(),
      periodEndAt: periodEnd.toISOString(),
      effectiveAt: effectiveAt.toISOString(),
      quoteExpiresAt: quoteExpiresAt.toISOString(),
      provider: "mock",
    };
  }

  async confirmUpgrade(userId: string, planVersionId: string, idempotencyKey?: string) {
    const key = idempotencyKey ?? `upgrade-confirm:${userId}:${planVersionId}`;
    const requestPath = "/billing/upgrade/confirm";

    const existingRecord = await this.prisma.client.idempotencyRecord.findUnique({
      where: { key_requestPath: { key, requestPath } },
    });
    if (existingRecord?.responseBody) {
      const cached = existingRecord.responseBody as {
        state: string;
        paymentId: string;
        message: string;
      };
      const existingPayment = await this.prisma.client.paymentTransaction.findUnique({
        where: { id: cached.paymentId },
      });
      if (existingPayment?.state === "PENDING") {
        return cached;
      }
    }

    const target = await this.prisma.client.planVersion.findUniqueOrThrow({
      where: { id: planVersionId },
    });

    const preview = await this.previewUpgrade(userId, planVersionId);

    const payment = await this.prisma.client.paymentTransaction.create({
      data: {
        userId,
        provider: "mock",
        providerTxnId: `mock_${crypto.randomUUID()}`,
        amountMinor: preview.dueNowMinor,
        currency: target.currency,
        state: "PENDING",
        planVersionId: target.id,
      },
    });

    const response = {
      state: "PROCESSING",
      paymentId: payment.id,
      message: "Payment pending webhook confirmation.",
    };

    await this.prisma.client.idempotencyRecord.create({
      data: {
        key,
        userId,
        requestPath,
        responseBody: response,
        statusCode: 200,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });

    return response;
  }

  async processMockWebhook(body: {
    paymentId: string;
    event: string;
    providerEventId?: string;
  }) {
    const providerEventId = body.providerEventId ?? `mock_evt_${body.paymentId}_${body.event}`;

    const existingEvent = await this.prisma.client.webhookEvent.findUnique({
      where: {
        provider_providerEventId: { provider: "mock", providerEventId },
      },
    });
    if (existingEvent?.state === "PROCESSED") {
      const payment = await this.prisma.client.paymentTransaction.findUniqueOrThrow({
        where: { id: body.paymentId },
      });
      return {
        processed: true,
        duplicate: true,
        state: payment.state,
      };
    }

    const payment = await this.prisma.client.paymentTransaction.findUniqueOrThrow({
      where: { id: body.paymentId },
    });

    if (body.event === "payment.failed") {
      await this.prisma.client.paymentTransaction.update({
        where: { id: payment.id },
        data: { state: "FAILED" },
      });

      await this.prisma.client.webhookEvent.create({
        data: {
          provider: "mock",
          providerEventId,
          signatureVerified: true,
          state: "PROCESSED",
          processedAt: new Date(),
        },
      });

      return { processed: true, state: "FAILED" };
    }

    if (body.event !== "payment.succeeded") {
      return { processed: false, reason: "UNSUPPORTED_EVENT" };
    }

    if (payment.state === "SUCCEEDED") {
      await this.prisma.client.webhookEvent.upsert({
        where: {
          provider_providerEventId: { provider: "mock", providerEventId },
        },
        create: {
          provider: "mock",
          providerEventId,
          signatureVerified: true,
          state: "PROCESSED",
          processedAt: new Date(),
        },
        update: {},
      });
      return { processed: true, duplicate: true, state: "SUCCEEDED" };
    }

    await this.prisma.client.paymentTransaction.update({
      where: { id: payment.id },
      data: { state: "SUCCEEDED" },
    });

    if (payment.planVersionId) {
      const planVersion = await this.prisma.client.planVersion.findUniqueOrThrow({
        where: { id: payment.planVersionId },
      });

      const period = await this.prisma.client.entitlementPeriod.findFirst({
        where: { userId: payment.userId, status: "ACTIVE" },
      });

      const currentLimit = period?.quotaLimit ?? 0;
      const quotaProjection = calculateUpgradeQuota({
        currentLimit,
        newLimit: planVersion.applicationQuota,
        quotaUsed: (await this.quota.getQuotaSummary(payment.userId)).quotaUsed,
      });

      await this.prisma.client.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planVersionId: planVersion.id,
          state: "ACTIVE",
          provider: "mock",
          currentPeriodStart: period?.periodStart ?? new Date(),
          currentPeriodEnd: period?.periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          planVersionId: planVersion.id,
          state: "ACTIVE",
        },
      });

      if (period) {
        await this.prisma.client.entitlementPeriod.update({
          where: { id: period.id },
          data: { quotaLimit: planVersion.applicationQuota, planVersionId: planVersion.id },
        });

        if (quotaProjection.quotaDelta > 0) {
          await this.prisma.client.quotaLedgerEntry.create({
            data: {
              userId: payment.userId,
              entitlementPeriodId: period.id,
              entryType: "GRANT",
              units: quotaProjection.quotaDelta,
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
        providerEventId,
        signatureVerified: true,
        state: "PROCESSED",
        processedAt: new Date(),
      },
    });

    return { processed: true, state: "ACTIVE" };
  }

  async scheduleDowngrade(userId: string, planVersionId: string) {
    await this.prisma.client.subscription.updateMany({
      where: { userId },
      data: {
        state: "CHANGE_SCHEDULED",
        scheduledPlanVersionId: planVersionId,
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
