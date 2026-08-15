import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Module } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";
import {
  AdminAuthGuard,
  CurrentAdmin,
  CurrentAdminId,
  RequireAdminPermission,
} from "../../platform/admin-auth.guard.js";
import { AdminRbacService } from "../../platform/admin-rbac.service.js";
import { AdminAiController } from "./admin-ai.controller.js";
import { AdminAuthController } from "./admin-auth.controller.js";

@Controller("admin")
@UseGuards(AdminAuthGuard)
class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  @Get("overview")
  @RequireAdminPermission("customers.read")
  async overview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      registeredUsers,
      activeSubscriptions,
      applicationsTotal,
      applicationsSubmitted,
      waitingForUser,
      quotaConsumed,
      connectors,
    ] = await Promise.all([
      this.prisma.client.user.count(),
      this.prisma.client.subscription.count({ where: { state: "ACTIVE" } }),
      this.prisma.client.application.count(),
      this.prisma.client.application.count({
        where: { state: { in: ["SUBMITTED", "VERIFIED", "UNCERTAIN"] } },
      }),
      this.prisma.client.application.count({ where: { state: "WAITING_FOR_USER" } }),
      this.prisma.client.quotaLedgerEntry.aggregate({
        where: { entryType: "CONSUME" },
        _sum: { units: true },
      }),
      this.prisma.client.connector.findMany({
        select: { name: true, healthStatus: true, targetDomain: true },
      }),
    ]);

    const activeUsers = await this.prisma.client.user.count({
      where: {
        OR: [
          { applications: { some: { createdAt: { gte: thirtyDaysAgo } } } },
          { sessions: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        ],
      },
    });

    const subsWithPlan = await this.prisma.client.subscription.findMany({
      where: { state: "ACTIVE" },
      include: { planVersion: true },
    });
    const mrrMinor = subsWithPlan.reduce((sum, s) => sum + s.planVersion.priceMinor, 0);

    const byStatus = await this.prisma.client.application.groupBy({
      by: ["state"],
      _count: { _all: true },
    });

    const planDistribution = await this.prisma.client.subscription.groupBy({
      by: ["planVersionId"],
      _count: { _all: true },
    });

    const planVersions = await this.prisma.client.planVersion.findMany({
      include: { plan: true },
    });
    const planNameByVersion = new Map(planVersions.map((p) => [p.id, p.plan.name]));

    return {
      asOf: now.toISOString(),
      kpis: {
        registeredUsers,
        activeUsers,
        activeSubscriptions,
        mrrMinor,
        applicationsStarted: applicationsTotal,
        applicationsSubmitted,
        applicationCompletionRate:
          applicationsTotal > 0 ? applicationsSubmitted / applicationsTotal : 0,
        quotaConsumed: quotaConsumed._sum.units ?? 0,
        manualActionRequired: waitingForUser,
        providerHealth: connectors.map((c) => ({
          name: c.name,
          domain: c.targetDomain,
          status: c.healthStatus,
        })),
      },
      applicationsByStatus: byStatus.map((r) => ({ state: r.state, count: r._count._all })),
      planDistribution: planDistribution.map((r) => ({
        plan: planNameByVersion.get(r.planVersionId) ?? "Unknown",
        count: r._count._all,
      })),
    };
  }

  @Get("customers")
  @RequireAdminPermission("customers.read")
  async searchCustomers(@Query("q") q?: string, @Query("page") page = "1") {
    const pageNum = Math.max(1, Number(page) || 1);
    const take = 20;
    const skip = (pageNum - 1) * take;

    const users = await this.prisma.client.user.findMany({
      where: q
        ? { emails: { some: { displayValue: { contains: q, mode: "insensitive" } } } }
        : {},
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        emails: { where: { isPrimary: true }, take: 1 },
        subscriptions: { include: { planVersion: { include: { plan: true } } } },
      },
    });

    const total = await this.prisma.client.user.count({
      where: q
        ? { emails: { some: { displayValue: { contains: q, mode: "insensitive" } } } }
        : {},
    });

    return {
      customers: users.map((u) => ({
        id: u.id,
        email: u.emails[0]?.displayValue ?? null,
        onboardingState: u.onboardingState,
        onboardingPath: u.onboardingPath,
        status: u.status,
        planName: u.subscriptions[0]?.planVersion?.plan?.name ?? "Free",
        createdAt: u.createdAt,
      })),
      page: pageNum,
      total,
    };
  }

  @Get("customers/:id")
  @RequireAdminPermission("customers.read")
  async getCustomer(
    @Param("id") userId: string,
    @CurrentAdminId() adminId: string,
  ) {
    const grant = await this.prisma.client.supportAccessGrant.findFirst({
      where: {
        adminUserId: adminId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });

    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        emails: true,
        candidateProfile: {
          include: {
            jobTargets: true,
            preferences: true,
          },
        },
        subscriptions: { include: { planVersion: { include: { plan: true } } } },
        applications: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    const quota = await this.quota.getQuotaSummary(userId);
    const ledger = await this.prisma.client.quotaLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      id: user.id,
      email: grant ? user.emails.find((e) => e.isPrimary)?.displayValue : "[MASKED]",
      onboardingState: user.onboardingState,
      onboardingPath: user.onboardingPath,
      status: user.status,
      privateDataMasked: !grant,
      profile: user.candidateProfile
        ? {
            preferredName: user.candidateProfile.preferredName,
            profileVersion: user.candidateProfile.profileVersion,
            jobTargets: user.candidateProfile.jobTargets.map((t) => t.title),
          }
        : null,
      subscription: user.subscriptions[0]
        ? {
            planName: user.subscriptions[0].planVersion.plan.name,
            state: user.subscriptions[0].state,
            currentPeriodEnd: user.subscriptions[0].currentPeriodEnd,
          }
        : null,
      quota,
      recentLedger: ledger.map((e) => ({
        entryType: e.entryType,
        units: e.units,
        reasonCode: e.reasonCode,
        createdAt: e.createdAt,
      })),
      applications: user.applications.map((a) => ({
        id: a.id,
        state: a.state,
        createdAt: a.createdAt,
      })),
    };
  }

  @Post("quota-adjustment")
  @RequireAdminPermission("quota.adjust")
  async adjustQuota(
    @Body() body: { userId: string; units: number; reason: string; caseId?: string },
    @CurrentAdminId() adminId: string,
  ) {
    const period = await this.prisma.client.entitlementPeriod.findFirst({
      where: { userId: body.userId, status: "ACTIVE" },
    });
    if (!period) throw new Error("NO_ACTIVE_PERIOD");

    await this.prisma.client.quotaLedgerEntry.create({
      data: {
        userId: body.userId,
        entitlementPeriodId: period.id,
        entryType: "ADMIN_ADJUSTMENT",
        units: body.units,
        operationKey: `admin-adjust:${crypto.randomUUID()}`,
        reasonCode: body.reason,
        actorType: "ADMIN",
        actorId: adminId,
      },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: "QUOTA_ADJUSTMENT",
        targetType: "USER",
        targetId: body.userId,
        reason: body.reason,
        metadata: { units: body.units, caseId: body.caseId },
      },
    });

    return { adjusted: true, units: body.units };
  }

  @Post("connectors/kill-switch")
  @RequireAdminPermission("connectors.manage")
  async killSwitch(
    @Body() body: { domain: string; active: boolean },
    @CurrentAdminId() adminId: string,
  ) {
    await this.prisma.client.domainPolicy.updateMany({
      where: { domain: body.domain },
      data: { killSwitchActive: body.active },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: body.active ? "KILL_SWITCH_ON" : "KILL_SWITCH_OFF",
        targetType: "DOMAIN_POLICY",
        targetId: body.domain,
      },
    });

    return { domain: body.domain, killSwitchActive: body.active };
  }

  @Get("audit")
  @RequireAdminPermission("audit.read")
  async getAudit() {
    const events = await this.prisma.client.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { events };
  }

  @Get("plans")
  @RequireAdminPermission("plans.manage")
  async listPlans() {
    const plans = await this.prisma.client.plan.findMany({
      include: {
        versions: { orderBy: { version: "desc" } },
      },
    });
    return { plans };
  }

  @Get("applications")
  @RequireAdminPermission("customers.read")
  async listApplications(@Query("state") state?: string, @Query("q") q?: string) {
    const apps = await this.prisma.client.application.findMany({
      where: {
        ...(state ? { state } : {}),
        ...(q
          ? {
              user: {
                emails: { some: { displayValue: { contains: q, mode: "insensitive" } } },
              },
            }
          : {}),
      },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { emails: { where: { isPrimary: true }, take: 1 } } },
        job: { select: { title: true, company: true } },
      },
    });
    return {
      applications: apps.map((a) => ({
        id: a.id,
        state: a.state,
        mode: a.mode,
        userEmail: a.user.emails[0]?.displayValue ?? null,
        jobTitle: a.job?.title,
        company: a.job?.company,
        createdAt: a.createdAt,
      })),
    };
  }
}

@Module({
  controllers: [AdminController, AdminAiController, AdminAuthController],
})
export class AdminModule {}
