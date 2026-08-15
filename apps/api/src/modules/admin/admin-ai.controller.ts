import { createHash, randomBytes } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  BadRequestException,
} from "@nestjs/common";
import { canPublishAiRoute } from "@applyflow/domain";
import { PrismaService } from "../../platform/prisma.service.js";

function fingerprintSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 16);
}

@Controller("admin/ai")
export class AdminAiController {
  constructor(private readonly prisma: PrismaService) {}

  private async authorize(adminToken: string | undefined, permission: string): Promise<string> {
    if (!adminToken) throw new BadRequestException({ code: "UNAUTHORIZED", message: "Admin required." });
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
    if (!admin) throw new BadRequestException({ code: "UNAUTHORIZED", message: "Admin required." });

    const perms = admin.roleAssignments.flatMap((a) =>
      a.role.permissions.map((p) => p.permission.code),
    );
    if (!perms.includes(permission)) {
      throw new BadRequestException({ code: "FORBIDDEN", message: "Permission denied." });
    }
    return admin.id;
  }

  @Get("providers")
  async listProviders(@Headers("x-admin-email") adminEmail?: string) {
    await this.authorize(adminEmail, "ai.manage");
    const providers = await this.prisma.client.aiProvider.findMany({ orderBy: { createdAt: "desc" } });
    return {
      providers: providers.map((p) => ({
        id: p.id,
        providerType: p.providerType,
        displayName: p.displayName,
        enabled: p.enabled,
        healthStatus: p.healthStatus,
        secretFingerprint: p.secretFingerprint,
        hasSecret: !!p.secretRef,
      })),
    };
  }

  @Post("providers")
  async createProvider(
    @Body() body: { providerType: string; displayName: string; apiKey: string },
    @Headers("x-admin-email") adminEmail?: string,
  ) {
    const adminId = await this.authorize(adminEmail, "ai.manage");
    if (!body.apiKey || body.apiKey.length < 8) {
      throw new BadRequestException({ code: "INVALID_SECRET", message: "API key too short." });
    }

    const provider = await this.prisma.client.aiProvider.create({
      data: {
        providerType: body.providerType,
        displayName: body.displayName,
        secretRef: `local:${randomBytes(8).toString("hex")}`,
        secretFingerprint: fingerprintSecret(body.apiKey),
        enabled: true,
        healthStatus: "HEALTHY",
      },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: "AI_PROVIDER_SECRET_STORED",
        targetType: "AI_PROVIDER",
        targetId: provider.id,
        outcome: "SUCCESS",
      },
    });

    return {
      id: provider.id,
      displayName: provider.displayName,
      secretFingerprint: provider.secretFingerprint,
      stored: true,
    };
  }

  @Get("routes")
  async listRoutes(@Headers("x-admin-email") adminEmail?: string) {
    await this.authorize(adminEmail, "ai.manage");
    const routes = await this.prisma.client.aiTaskRoute.findMany({
      include: { provider: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      routes: routes.map((r) => ({
        id: r.id,
        taskType: r.taskType,
        environment: r.environment,
        model: r.model,
        promptVersion: r.promptVersion,
        status: r.status,
        provider: { id: r.provider.id, displayName: r.provider.displayName },
      })),
    };
  }

  @Post("routes")
  async createRoute(
    @Body()
    body: {
      taskType: string;
      providerId: string;
      model: string;
      promptVersion: string;
      schemaVersion?: string;
    },
    @Headers("x-admin-email") adminEmail?: string,
  ) {
    const adminId = await this.authorize(adminEmail, "ai.manage");
    const route = await this.prisma.client.aiTaskRoute.create({
      data: {
        taskType: body.taskType,
        providerId: body.providerId,
        model: body.model,
        promptVersion: body.promptVersion,
        schemaVersion: body.schemaVersion ?? "1",
        status: "DRAFT",
      },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: "AI_ROUTE_CREATED",
        targetType: "AI_TASK_ROUTE",
        targetId: route.id,
      },
    });

    return route;
  }

  @Post("routes/:id/publish")
  async publishRoute(
    @Param("id") id: string,
    @Body() body: { evalScore: number },
    @Headers("x-admin-email") adminEmail?: string,
  ) {
    const adminId = await this.authorize(adminEmail, "ai.manage");
    const route = await this.prisma.client.aiTaskRoute.findUniqueOrThrow({ where: { id } });

    const publishCheck = canPublishAiRoute({ evalScore: body.evalScore });
    if (!publishCheck.allowed) {
      await this.prisma.client.auditEvent.create({
        data: {
          actorType: "ADMIN",
          adminUserId: adminId,
          action: "AI_ROUTE_PUBLISH_BLOCKED",
          targetType: "AI_TASK_ROUTE",
          targetId: id,
          metadata: { evalScore: body.evalScore, code: publishCheck.code },
          outcome: "FAILURE",
        },
      });
      throw new BadRequestException({
        code: publishCheck.code,
        message: "Route eval score below required threshold.",
      });
    }

    await this.prisma.client.aiTaskRoute.updateMany({
      where: {
        taskType: route.taskType,
        environment: route.environment,
        status: "PUBLISHED",
      },
      data: { status: "ARCHIVED" },
    });

    const published = await this.prisma.client.aiTaskRoute.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: "AI_ROUTE_PUBLISHED",
        targetType: "AI_TASK_ROUTE",
        targetId: id,
        metadata: { evalScore: body.evalScore },
        outcome: "SUCCESS",
      },
    });

    return { published: true, routeId: published.id, status: published.status };
  }
}
