import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

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

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.client.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
