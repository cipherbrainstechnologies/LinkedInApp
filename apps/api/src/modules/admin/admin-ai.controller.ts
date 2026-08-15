import { createHash, randomBytes } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { canPublishAiRoute } from "@applyflow/domain";
import { getConfig } from "@applyflow/config";
import { PrismaService } from "../../platform/prisma.service.js";
import {
  AdminAuthGuard,
  CurrentAdminId,
  RequireAdminPermission,
} from "../../platform/admin-auth.guard.js";

function fingerprintSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 16);
}

@Controller("admin/ai")
@UseGuards(AdminAuthGuard)
export class AdminAiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("providers")
  @RequireAdminPermission("ai.manage")
  async listProviders() {
    const providers = await this.prisma.client.aiProvider.findMany({ orderBy: { createdAt: "desc" } });
    return {
      providers: providers.map((p) => ({
        id: p.id,
        providerType: p.providerType,
        displayName: p.displayName,
        enabled: p.enabled,
        healthStatus: p.healthStatus,
        secretFingerprint: p.secretFingerprint,
        configuredAt: p.createdAt,
        lastVerifiedAt: p.createdAt,
      })),
    };
  }

  @Post("providers")
  @RequireAdminPermission("ai.manage")
  async storeProvider(
    @Body()
    body: {
      providerType: string;
      displayName: string;
      apiKey: string;
      modelAllowlist?: string[];
    },
    @CurrentAdminId() adminId: string,
  ) {
    const fingerprint = fingerprintSecret(body.apiKey);
    const provider = await this.prisma.client.aiProvider.create({
      data: {
        providerType: body.providerType,
        displayName: body.displayName,
        enabled: true,
        secretFingerprint: fingerprint,
        secretRef: `enc:${fingerprint}`,
        healthStatus: "HEALTHY",
      },
    });

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: adminId,
        action: "AI_PROVIDER_CONFIGURED",
        targetType: "AI_PROVIDER",
        targetId: provider.id,
        metadata: { fingerprint },
      },
    });

    return {
      id: provider.id,
      secretFingerprint: fingerprint,
      apiKey: undefined,
    };
  }

  @Post("providers/:id/test")
  @RequireAdminPermission("ai.manage")
  async testConnection(@Param("id") id: string) {
    const config = getConfig();
    const provider = await this.prisma.client.aiProvider.findUniqueOrThrow({ where: { id } });

    if (!provider.enabled) {
      return { success: false, message: "Provider is disabled." };
    }

    if (config.OPENAI_ENABLED || config.ANTHROPIC_ENABLED) {
      return {
        success: false,
        message: "Real provider test not wired in demo — enable mock mode.",
      };
    }

    await this.prisma.client.aiProvider.update({
      where: { id },
      data: { healthStatus: "HEALTHY" },
    });

    return {
      success: true,
      message: `Mock connection OK for ${provider.displayName} (fingerprint ${provider.secretFingerprint}).`,
      latencyMs: 42,
    };
  }

  @Get("routes")
  @RequireAdminPermission("ai.manage")
  async listRoutes() {
    const routes = await this.prisma.client.aiTaskRoute.findMany({ orderBy: { createdAt: "desc" } });
    return { routes };
  }

  @Post("routes")
  @RequireAdminPermission("ai.manage")
  async createRoute(
    @Body()
    body: {
      taskType: string;
      environment: string;
      providerId: string;
      model: string;
      promptVersion: string;
      schemaVersion: string;
    },
    @CurrentAdminId() adminId: string,
  ) {
    const route = await this.prisma.client.aiTaskRoute.create({
      data: {
        ...body,
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

    return { route };
  }

  @Post("routes/:id/publish")
  @RequireAdminPermission("ai.manage")
  async publishRoute(
    @Param("id") id: string,
    @Body() body: { evalScore: number },
    @CurrentAdminId() adminId: string,
  ) {
    const route = await this.prisma.client.aiTaskRoute.findUniqueOrThrow({ where: { id } });
    const gate = canPublishAiRoute({ evalScore: body.evalScore });
    if (!gate.allowed) {
      throw new BadRequestException({ code: gate.code, message: gate.code });
    }

    await this.prisma.client.aiTaskRoute.update({
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
      },
    });

    return { published: true };
  }
}
