import { Injectable } from "@nestjs/common";
import { calculateAvailableQuota } from "@applyflow/domain";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedgerEntries(userId: string) {
    const period = await this.getActivePeriod(userId);
    if (!period) return [];

    return this.prisma.client.quotaLedgerEntry.findMany({
      where: { userId, entitlementPeriodId: period.id },
      orderBy: { createdAt: "asc" },
    });
  }

  async getAvailableQuota(userId: string): Promise<number> {
    const entries = await this.getLedgerEntries(userId);
    return calculateAvailableQuota(
      entries.map((e) => ({
        entryType: e.entryType as "GRANT" | "RESERVE" | "RELEASE" | "CONSUME" | "REVERSE" | "EXPIRE" | "ADMIN_ADJUSTMENT" | "REFERRAL_GRANT",
        units: e.units,
        operationKey: e.operationKey,
      })),
    );
  }

  async getQuotaSummary(userId: string) {
    const period = await this.getActivePeriod(userId);
    const available = await this.getAvailableQuota(userId);
    const entries = await this.getLedgerEntries(userId);
    const consumed = entries
      .filter((e) => e.entryType === "CONSUME")
      .reduce((sum, e) => sum + e.units, 0);

    return {
      quotaLimit: period?.quotaLimit ?? 5,
      quotaUsed: consumed,
      quotaAvailable: available,
      resetAt: period?.periodEnd ?? null,
    };
  }

  async getActivePeriod(userId: string) {
    return this.prisma.client.entitlementPeriod.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        periodEnd: { gt: new Date() },
      },
      orderBy: { periodStart: "desc" },
    });
  }

  async grantInitialQuota(userId: string, units = 5): Promise<void> {
    const existing = await this.getActivePeriod(userId);
    if (existing) return;

    const freePlan = await this.prisma.client.plan.findUnique({ where: { slug: "free" } });
    if (!freePlan) return;

    const planVersion = await this.prisma.client.planVersion.findFirst({
      where: { planId: freePlan.id, status: "PUBLISHED" },
      orderBy: { version: "desc" },
    });
    if (!planVersion) return;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const period = await this.prisma.client.entitlementPeriod.create({
      data: {
        userId,
        planVersionId: planVersion.id,
        periodStart: now,
        periodEnd,
        quotaLimit: units,
        status: "ACTIVE",
      },
    });

    await this.prisma.client.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        entryType: "GRANT",
        units,
        operationKey: `grant:${userId}:${period.id}`,
        reasonCode: "INITIAL_FREE_GRANT",
        actorType: "SYSTEM",
      },
    });
  }

  async reserveQuota(userId: string, applicationId: string, operationKey: string): Promise<boolean> {
    const available = await this.getAvailableQuota(userId);
    if (available < 1) return false;

    const period = await this.getActivePeriod(userId);
    if (!period) return false;

    await this.prisma.client.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        applicationId,
        entryType: "RESERVE",
        units: 1,
        operationKey,
        reasonCode: "APPLICATION_RESERVE",
        actorType: "SYSTEM",
      },
    });
    return true;
  }

  async consumeQuota(userId: string, applicationId: string, operationKey: string): Promise<void> {
    const period = await this.getActivePeriod(userId);
    if (!period) return;

    await this.prisma.client.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        applicationId,
        entryType: "CONSUME",
        units: 1,
        operationKey,
        reasonCode: "APPLICATION_CONSUME",
        actorType: "SYSTEM",
      },
    });
  }

  async releaseQuota(userId: string, applicationId: string, operationKey: string): Promise<void> {
    const period = await this.getActivePeriod(userId);
    if (!period) return;

    await this.prisma.client.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        applicationId,
        entryType: "RELEASE",
        units: 1,
        operationKey: `${operationKey}:release`,
        reasonCode: "APPLICATION_RELEASE",
        actorType: "SYSTEM",
      },
    });
  }
}
