import { Injectable } from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import { signAccessToken, verifyAccessToken } from "@applyflow/auth";

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly ttl: number;

  constructor() {
    const config = getConfig();
    this.secret = config.JWT_ACCESS_SECRET;
    this.ttl = config.JWT_ACCESS_TTL_SECONDS;
  }

  async signAccessToken(userId: string): Promise<string> {
    return signAccessToken(this.secret, userId, this.ttl);
  }

  async verifyAccessToken(token: string): Promise<string | null> {
    return verifyAccessToken(this.secret, token);
  }

  getExpiresIn(): number {
    return this.ttl;
  }
}
