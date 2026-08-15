import { describe, expect, it, beforeAll } from "vitest";
import { createHash } from "node:crypto";
import { prisma } from "@applyflow/db";
import { BillingService } from "./billing.service.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

describe("BILL billing upgrade (API)", () => {
  let billing: BillingService;
  let userId: string;
  let launchVersionId: string;
  let powerVersionId: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    const quota = new QuotaService(prismaService);
    billing = new BillingService(prismaService, quota);

    const launchPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "launch" } });
    const powerPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "power" } });
    const launchVersion = await prisma.planVersion.findFirstOrThrow({
      where: { planId: launchPlan.id, status: "PUBLISHED" },
    });
    const powerVersion = await prisma.planVersion.findFirstOrThrow({
      where: { planId: powerPlan.id, status: "PUBLISHED" },
    });
    launchVersionId = launchVersion.id;
    powerVersionId = powerVersion.id;

    const email = `billing.test.${Date.now()}@demo.applyflow.local`;
    const user = await prisma.user.create({
      data: {
        status: "ACTIVE",
        onboardingState: "COMPLETED",
        emails: {
          create: {
            displayValue: email,
            valueHash: createHash("sha256").update(email).digest("hex"),
            verified: true,
            isPrimary: true,
            verifiedAt: new Date(),
          },
        },
      },
    });
    userId = user.id;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const period = await prisma.entitlementPeriod.create({
      data: {
        userId,
        planVersionId: launchVersion.id,
        periodStart: now,
        periodEnd,
        quotaLimit: 50,
        status: "ACTIVE",
      },
    });

    await prisma.subscription.create({
      data: {
        userId,
        planVersionId: launchVersion.id,
        state: "ACTIVE",
        provider: "mock",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await prisma.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        entryType: "GRANT",
        units: 50,
        operationKey: `bill-test-grant:${userId}`,
        reasonCode: "TEST",
        actorType: "SYSTEM",
      },
    });

    for (let i = 0; i < 20; i++) {
      await prisma.quotaLedgerEntry.create({
        data: {
          userId,
          entitlementPeriodId: period.id,
          entryType: "CONSUME",
          units: 1,
          operationKey: `bill-test-consume:${userId}:${i}`,
          reasonCode: "TEST",
          actorType: "SYSTEM",
        },
      });
    }
  });

  it("BILL-02: upgrade Launch 50 → Power 100 preserves 20 used and grants 80 available", async () => {
    const before = await billing.getSubscription(userId);
    expect(before.quota.quotaUsed).toBe(20);
    expect(before.quota.quotaLimit).toBe(50);
    expect(before.quota.quotaAvailable).toBe(30);

    const preview = await billing.previewUpgrade(userId, powerVersionId);
    expect(preview.newAvailable).toBe(80);
    expect(preview.quotaDelta).toBe(50);
    expect(preview.dueNowMinor).toBeGreaterThan(0);
    expect(preview.taxMinor).toBeGreaterThan(0);

    const confirm = await billing.confirmUpgrade(userId, powerVersionId, `bill-test-${Date.now()}`);
    const mid = await billing.getSubscription(userId);
    expect(mid.pendingPayment?.state).toBe("PENDING");
    expect(mid.quota.quotaAvailable).toBe(30);

    const webhook = await billing.processMockWebhook({
      paymentId: confirm.paymentId,
      event: "payment.succeeded",
    });
    expect(webhook.processed).toBe(true);

    const after = await billing.getSubscription(userId);
    expect(after.quota.quotaUsed).toBe(20);
    expect(after.quota.quotaLimit).toBe(100);
    expect(after.quota.quotaAvailable).toBe(80);
    expect(after.subscription?.planVersion?.plan?.slug).toBe("power");
  });

  it("BILL-05: failed webhook preserves old plan and quota", async () => {
    const before = await billing.getSubscription(userId);
    const confirm = await billing.confirmUpgrade(
      userId,
      powerVersionId,
      `bill-fail-${Date.now()}`,
    );

    const failed = await billing.processMockWebhook({
      paymentId: confirm.paymentId,
      event: "payment.failed",
    });
    expect(failed.state).toBe("FAILED");

    const after = await billing.getSubscription(userId);
    expect(after.quota.quotaUsed).toBe(before.quota.quotaUsed);
    expect(after.quota.quotaLimit).toBe(before.quota.quotaLimit);
    expect(after.quota.quotaAvailable).toBe(before.quota.quotaAvailable);
    expect(after.subscription?.planVersion?.plan?.slug).toBe("power");
  });

  it("BILL-06: duplicate success webhook is idempotent", async () => {
    const confirm = await billing.confirmUpgrade(
      userId,
      powerVersionId,
      `bill-dup-${Date.now()}`,
    );
    const first = await billing.processMockWebhook({
      paymentId: confirm.paymentId,
      event: "payment.succeeded",
      providerEventId: `dup_evt_${confirm.paymentId}`,
    });
    const quotaAfterFirst = (await billing.getSubscription(userId)).quota;

    const second = await billing.processMockWebhook({
      paymentId: confirm.paymentId,
      event: "payment.succeeded",
      providerEventId: `dup_evt_${confirm.paymentId}`,
    });
    expect(second.duplicate).toBe(true);

    const quotaAfterSecond = (await billing.getSubscription(userId)).quota;
    expect(quotaAfterSecond.quotaAvailable).toBe(quotaAfterFirst.quotaAvailable);
    expect(quotaAfterSecond.quotaLimit).toBe(quotaAfterFirst.quotaLimit);
    expect(first.processed).toBe(true);
  });

  it("BILL-07: confirm upgrade with same idempotency key returns same payment", async () => {
    const key = `bill-idem-${Date.now()}`;
    const first = await billing.confirmUpgrade(userId, launchVersionId, key);
    const second = await billing.confirmUpgrade(userId, launchVersionId, key);
    expect(second.paymentId).toBe(first.paymentId);
  });
});
