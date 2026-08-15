import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { RedisService } from "./redis.service.js";
import { QuotaService } from "./quota.service.js";
import { SessionService } from "./session.service.js";
import { StorageService } from "./storage.service.js";
import { AiService } from "./ai.service.js";

import { JwtService } from "./jwt.service.js";
import { OidcStateService } from "./oidc-state.service.js";

import { AuthGuard } from "./auth.guard.js";

@Module({
  providers: [
    PrismaService,
    RedisService,
    QuotaService,
    SessionService,
    StorageService,
    AiService,
    JwtService,
    OidcStateService,
    AuthGuard,
  ],
  exports: [
    PrismaService,
    RedisService,
    QuotaService,
    SessionService,
    StorageService,
    AiService,
    JwtService,
    OidcStateService,
    AuthGuard,
  ],
})
@Global()
export class PlatformModule {}
