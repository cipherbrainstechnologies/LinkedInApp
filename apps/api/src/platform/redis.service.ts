import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { getConfig } from "@applyflow/config";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    const config = getConfig();
    this.redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 3 });
  }

  get client(): Redis {
    return this.redis;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
