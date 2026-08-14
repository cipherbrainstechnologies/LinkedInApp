import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { SessionService } from "../../platform/session.service.js";
import { JwtService } from "../../platform/jwt.service.js";
import { PrismaService } from "../../platform/prisma.service.js";

describe("AUTH-04 refresh token rotation", () => {
  let sessions: SessionService;
  let userId: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    const jwtService = new JwtService();
    sessions = new SessionService(prismaService, jwtService);

    const user = await prisma.user.create({ data: { status: "ACTIVE" } });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.refreshTokenFamily.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("rotates refresh token and revokes family on reuse", async () => {
    const first = await sessions.createMobileCredentials(userId, "test-device");
    const rotated = await sessions.rotateRefreshToken(first.refreshToken);
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect(rotated.accessToken).toBeTruthy();

    await expect(sessions.rotateRefreshToken(first.refreshToken)).rejects.toMatchObject({
      response: { code: "REFRESH_REUSE" },
    });

    const family = await prisma.refreshTokenFamily.findFirst({ where: { userId } });
    expect(family?.revokedAt).not.toBeNull();
  });
});
