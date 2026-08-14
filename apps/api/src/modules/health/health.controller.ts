import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma.service.js";
import { RedisService } from "../../platform/redis.service.js";

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get(["health", "healthz"])
  async health() {
    let database: "ok" | "degraded" | "down" = "down";
    let redis: "ok" | "degraded" | "down" = "down";

    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "down";
    }

    redis = (await this.redis.ping()) ? "ok" : "down";

    return {
      status: database === "ok" ? "ok" : "degraded",
      version: "0.1.0",
      services: { database, redis },
    };
  }
}
