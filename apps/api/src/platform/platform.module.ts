import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { RedisService } from "./redis.service.js";
import { QuotaService } from "./quota.service.js";
import { SessionService } from "./session.service.js";

@Module({
  providers: [PrismaService, RedisService, QuotaService, SessionService],
  exports: [PrismaService, RedisService, QuotaService, SessionService],
})
@Global()
export class PlatformModule {}
