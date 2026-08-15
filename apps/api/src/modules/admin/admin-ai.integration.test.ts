import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { AdminAiController } from "../admin/admin-ai.controller.js";
import { PrismaService } from "../../platform/prisma.service.js";

describe("AI-05/06 admin AI routes", () => {
  let controller: AdminAiController;
  let providerId: string;
  let routeId: string;
  const adminEmail = "ops@demo.applyflow.local";

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    controller = new AdminAiController(prismaService);

    const opsRole = await prisma.adminRole.findFirst({ where: { name: "ops" } });
    const aiPerm = await prisma.adminPermission.findFirst({ where: { code: "ai.manage" } });
    if (opsRole && aiPerm) {
      await prisma.adminRolePermission.upsert({
        where: { roleId_permissionId: { roleId: opsRole.id, permissionId: aiPerm.id } },
        create: { roleId: opsRole.id, permissionId: aiPerm.id },
        update: {},
      });
    }

    const created = await controller.createProvider(
      { providerType: "mock", displayName: "Integration Test Provider", apiKey: "sk-test-secret-key-12345" },
      adminEmail,
    );
    providerId = created.id;
  });

  afterAll(async () => {
    if (routeId) await prisma.aiTaskRoute.deleteMany({ where: { id: routeId } });
    if (providerId) await prisma.aiProvider.deleteMany({ where: { id: providerId } });
    await prisma.$disconnect();
  });

  it("stores provider secret as fingerprint only (AI-06)", async () => {
    const listed = await controller.listProviders(adminEmail);
    const stored = listed.providers.find((p) => p.id === providerId);
    expect(stored?.hasSecret).toBe(true);
    expect(stored?.secretFingerprint).toBeTruthy();
    expect((stored as { apiKey?: string }).apiKey).toBeUndefined();
  });

  it("blocks route publish when eval below threshold (AI-05)", async () => {
    const created = await controller.createRoute(
      {
        taskType: "RESUME_EXTRACTION_TEST",
        providerId,
        model: "mock-v2",
        promptVersion: "2.0",
      },
      adminEmail,
    );
    routeId = created.id;

    await expect(
      controller.publishRoute(routeId, { evalScore: 0.2 }, adminEmail),
    ).rejects.toMatchObject({ response: { code: "EVAL_THRESHOLD_FAILED" } });

    const published = await controller.publishRoute(routeId, { evalScore: 0.9 }, adminEmail);
    expect(published.published).toBe(true);
  });
});
