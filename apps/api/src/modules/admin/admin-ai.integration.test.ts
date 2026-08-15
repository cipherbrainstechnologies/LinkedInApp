import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { AdminAiController } from "./admin-ai.controller.js";
import { PrismaService } from "../../platform/prisma.service.js";

describe("AI-05/06 admin AI routes", () => {
  let controller: AdminAiController;
  let providerId: string;
  let routeId: string;
  let opsAdminId: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    controller = new AdminAiController(prismaService);

    const opsAdmin = await prisma.adminUser.findFirst({ where: { email: "ops@demo.applyflow.local" } });
    if (!opsAdmin) throw new Error("ops admin missing");
    opsAdminId = opsAdmin.id;

    const created = await controller.storeProvider(
      {
        providerType: "mock",
        displayName: "Integration Test Provider",
        apiKey: "sk-test-secret-key-12345",
      },
      opsAdminId,
    );
    providerId = created.id;
  });

  afterAll(async () => {
    if (routeId) await prisma.aiTaskRoute.deleteMany({ where: { id: routeId } });
    if (providerId) await prisma.aiProvider.deleteMany({ where: { id: providerId } });
    await prisma.$disconnect();
  });

  it("stores provider secret as fingerprint only (AI-06)", async () => {
    const listed = await controller.listProviders();
    const stored = listed.providers.find((p) => p.id === providerId);
    expect(stored?.secretFingerprint).toBeTruthy();
    expect((stored as { apiKey?: string }).apiKey).toBeUndefined();
  });

  it("blocks route publish when eval below threshold (AI-05)", async () => {
    const created = await controller.createRoute(
      {
        taskType: "RESUME_EXTRACTION_TEST",
        environment: "demo",
        providerId,
        model: "mock-v2",
        promptVersion: "2.0",
        schemaVersion: "1.0",
      },
      opsAdminId,
    );
    routeId = created.route.id;

    await expect(controller.publishRoute(routeId, { evalScore: 0.2 }, opsAdminId)).rejects.toMatchObject({
      response: { code: "EVAL_THRESHOLD_FAILED" },
    });

    const published = await controller.publishRoute(routeId, { evalScore: 0.9 }, opsAdminId);
    expect(published.published).toBe(true);
  });
});
