import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { RedisService } from "./redis.service.js";
import { QuotaService } from "./quota.service.js";
import { SessionService } from "./session.service.js";
import { StorageService } from "./storage.service.js";
import { AiService } from "./ai.service.js";

@Module({
  providers: [PrismaService, RedisService, QuotaService, SessionService, StorageService, AiService],
  exports: [PrismaService, RedisService, QuotaService, SessionService, StorageService, AiService],
})
@Global()
export class PlatformModule {}
