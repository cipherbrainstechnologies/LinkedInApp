import { createHash, randomBytes, randomInt } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { JwtService } from "./jwt.service.js";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  generateToken(): string {
    return randomBytes(32).toString("base64url");
  }

  async createSession(userId: string, deviceLabel?: string): Promise<{ sessionId: string; token: string }> {
    const token = this.generateToken();
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.client.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        familyId,
        deviceLabel,
        expiresAt,
      },
    });

    return { sessionId: session.id, token };
  }

  async createMobileCredentials(
    userId: string,
    deviceLabel?: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; familyId: string }> {
    const refreshToken = this.generateToken();
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.client.refreshTokenFamily.create({
      data: { id: familyId, userId },
    });

    await this.prisma.client.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        deviceLabel,
        assuranceLevel: "mobile",
        expiresAt,
      },
    });

    const accessToken = await this.jwt.signAccessToken(userId);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwt.getExpiresIn(),
      familyId,
    };
  }

  async validateSession(token: string): Promise<string | null> {
    const hash = this.hashToken(token);
    const session = await this.prisma.client.session.findFirst({
      where: {
        tokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return session?.userId ?? null;
  }

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; userId: string }> {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.client.session.findFirst({
      where: { tokenHash: hash },
    });

    if (!session) {
      throw new UnauthorizedException({ code: "REFRESH_INVALID", message: "Invalid refresh token." });
    }

    if (session.revokedAt) {
      await this.revokeTokenFamily(session.familyId, "REFRESH_TOKEN_REUSE");
      throw new UnauthorizedException({ code: "REFRESH_REUSE", message: "Refresh token reuse detected." });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: "REFRESH_EXPIRED", message: "Refresh token expired." });
    }

    const family = await this.prisma.client.refreshTokenFamily.findUnique({
      where: { id: session.familyId },
    });
    if (family?.revokedAt) {
      throw new UnauthorizedException({ code: "FAMILY_REVOKED", message: "Session family revoked." });
    }

    const newRefreshToken = this.generateToken();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.client.$transaction([
      this.prisma.client.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.client.session.create({
        data: {
          userId: session.userId,
          tokenHash: this.hashToken(newRefreshToken),
          familyId: session.familyId,
          deviceLabel: session.deviceLabel,
          assuranceLevel: session.assuranceLevel,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const accessToken = await this.jwt.signAccessToken(session.userId);
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwt.getExpiresIn(),
      userId: session.userId,
    };
  }

  async revokeTokenFamily(familyId: string, reason: string): Promise<void> {
    await this.prisma.client.refreshTokenFamily.update({
      where: { id: familyId },
      data: { revokedAt: new Date() },
    });
    await this.prisma.client.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "SYSTEM",
        action: "REFRESH_FAMILY_REVOKED",
        targetType: "REFRESH_TOKEN_FAMILY",
        targetId: familyId,
        reason,
        outcome: "SUCCESS",
      },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.client.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.client.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceLabel: true,
        assuranceLevel: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  generateEmailVerificationCode(): string {
    return String(randomInt(100000, 999999));
  }
}
