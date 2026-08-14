import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

@Controller("admin")
class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  private async authorize(adminToken: string | undefined, permission: string): Promise<string> {
    if (!adminToken) throw new Error("UNAUTHORIZED");
    const admin = await this.prisma.client.adminUser.findFirst({
      where: { email: adminToken },
      include: {
        roleAssignments: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!admin) throw new Error("UNAUTHORIZED");

    const perms = admin.roleAssignments.flatMap((a) =>
      a.role.permissions.map((p) => p.permission.code),
    );
    if (!perms.includes(permission)) throw new Error("FORBIDDEN");
    return admin.id;
  }

  @Get("customers")
  async searchCustomers(
    @Headers("x-admin-email") adminEmail?: string,
    @Query("q") q?: string,
  ) {
    await this.authorize(adminEmail, "customers.read");

    const users = await this.prisma.client.user.findMany({
      where: q
        ? { emails: { some: { displayValue: { contains: q, mode: "insensitive" } } } }
        : {},
      take: 20,
      include: { emails: { where: { isPrimary: true }, take: 1 } },
    });

    return {
      customers: users.map((u) => ({
        id: u.id,
        email: u.emails[0]?.displayValue ?? null,
        onboardingState: u.onboardingState,
        status: u.status,
      })),
    };
  }

  @Get("customers/:id")
  async getCustomer(@Param("id") userId: string, @Headers("x-admin-email") adminEmail?: string) {
    const adminId = await this.authorize(adminEmail, "customers.read");
    const grant = await this.prisma.client.supportAccessGrant.findFirst({
      where: {
        adminUserId: adminId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });

    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      include: { emails: true },
    });

    return {
      id: user.id,
      email: grant ? user.emails[0]?.displayValue : "[MASKED]",
      onboardingState: user.onboardingState,
      privateDataMasked: !grant,
    };
  }

  @Post("quota-adjustment")
  async adjustQuota(
    @Body() body: { userId: string; units: number; reason: string; caseId?: string },
    @Headers("x-admin-email") adminEmail?: string,
  ) {
    const adminId = await this.authorize(adminEmail, "quota.adjust");

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
  async killSwitch(
    @Body() body: { domain: string; active: boolean },
    @Headers("x-admin-email") adminEmail?: string,
  ) {
    const adminId = await this.authorize(adminEmail, "connectors.manage");

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
  async getAudit(@Headers("x-admin-email") adminEmail?: string) {
    await this.authorize(adminEmail, "audit.read");
    const events = await this.prisma.client.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { events };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
