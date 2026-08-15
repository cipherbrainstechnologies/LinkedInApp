import { describe, expect, it, beforeAll } from "vitest";
import { prisma } from "@applyflow/db";
import { AdminSessionService } from "../../platform/admin-session.service.js";
import { AdminRbacService } from "../../platform/admin-rbac.service.js";
import { PrismaService } from "../../platform/prisma.service.js";

describe("Admin auth (API)", () => {
  let sessions: AdminSessionService;
  let rbac: AdminRbacService;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    sessions = new AdminSessionService(prismaService);
    rbac = new AdminRbacService(prismaService);
  });

  it("creates session for seeded support admin", async () => {
    const admin = await rbac.getAdminByEmail("support@demo.applyflow.local");
    expect(admin).not.toBeNull();
    const { token } = await sessions.createSession(admin!.id, "test");
    const adminId = await sessions.validateSession(token);
    expect(adminId).toBe(admin!.id);
  });

  it("support admin has customers.read and quota.adjust", async () => {
    const admin = await rbac.getAdminByEmail("support@demo.applyflow.local");
    expect(admin?.permissions).toContain("customers.read");
    expect(admin?.permissions).toContain("quota.adjust");
  });

  it("auditor cannot pass quota.adjust permission check", async () => {
    const auditor = await rbac.getAdminByEmail("auditor@demo.applyflow.local");
    expect(auditor?.permissions.includes("quota.adjust")).toBe(false);
  });
});
