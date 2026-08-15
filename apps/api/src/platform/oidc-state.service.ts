import { Injectable } from "@nestjs/common";
import type { OidcStartParams } from "@applyflow/auth";
import { OIDC_STATE_TTL_MS } from "@applyflow/auth";
import { RedisService } from "./redis.service.js";

const PREFIX = "oidc:state:";
const EMAIL_PREFIX = "email:verify:";

@Injectable()
export class OidcStateService {
  constructor(private readonly redis: RedisService) {}

  async saveState(params: OidcStartParams): Promise<void> {
    await this.redis.client.set(
      `${PREFIX}${params.state}`,
      JSON.stringify(params),
      "EX",
      Math.ceil(OIDC_STATE_TTL_MS / 1000),
    );
  }

  async consumeState(state: string): Promise<OidcStartParams | null> {
    const key = `${PREFIX}${state}`;
    const raw = await this.redis.client.get(key);
    if (!raw) return null;
    await this.redis.client.del(key);
    try {
      return JSON.parse(raw) as OidcStartParams;
    } catch {
      return null;
    }
  }

  async saveEmailVerificationCode(userId: string, email: string, code: string): Promise<void> {
    await this.redis.client.set(
      `${EMAIL_PREFIX}${code}`,
      JSON.stringify({ userId, email }),
      "EX",
      900,
    );
  }

  async consumeEmailVerificationCode(code: string): Promise<{ userId: string; email: string } | null> {
    const key = `${EMAIL_PREFIX}${code}`;
    const raw = await this.redis.client.get(key);
    if (!raw) return null;
    await this.redis.client.del(key);
    try {
      return JSON.parse(raw) as { userId: string; email: string };
    } catch {
      return null;
    }
  }
}
