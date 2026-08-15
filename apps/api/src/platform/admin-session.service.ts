import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class AdminSessionService {
  constructor(private readonly prisma: PrismaService) {}

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  generateToken(): string {
    return randomBytes(32).toString("base64url");
  }

  async createSession(adminUserId: string, deviceLabel?: string): Promise<{ sessionId: string; token: string }> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    const session = await this.prisma.client.adminSession.create({
      data: {
        adminUserId,
        tokenHash: this.hashToken(token),
        deviceLabel,
        expiresAt,
      },
    });

    return { sessionId: session.id, token };
  }

  async validateSession(token: string): Promise<string | null> {
    const hash = this.hashToken(token);
    const session = await this.prisma.client.adminSession.findFirst({
      where: {
        tokenHash: hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        adminUser: true,
      },
    });
    if (!session || session.adminUser.status !== "ACTIVE") return null;
    return session.adminUserId;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.client.adminSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByToken(token: string): Promise<void> {
    const hash = this.hashToken(token);
    await this.prisma.client.adminSession.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const ADMIN_SESSION_COOKIE = "applyflow_admin_session";
