import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AdminRbacService } from "../../platform/admin-rbac.service.js";
import {
  AdminAuthGuard,
  CurrentAdmin,
} from "../../platform/admin-auth.guard.js";
import {
  AdminSessionService,
  ADMIN_SESSION_COOKIE,
} from "../../platform/admin-session.service.js";
import { PrismaService } from "../../platform/prisma.service.js";

const DEMO_ADMIN_EMAIL = "support@demo.applyflow.local";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private readonly sessions: AdminSessionService,
    private readonly rbac: AdminRbacService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("demo/login")
  async demoLogin(
    @Body() body: { email?: string },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const config = getConfig();
    if (config.APP_ENV === "production" || !config.DEMO_AUTH_ENABLED) {
      throw new ForbiddenException({
        code: "DEMO_AUTH_DISABLED",
        message: "Demo admin login is not available.",
      });
    }

    const email = body.email ?? DEMO_ADMIN_EMAIL;
    const admin = await this.rbac.getAdminByEmail(email);
    if (!admin) {
      throw new ForbiddenException({ code: "ADMIN_NOT_FOUND", message: "Admin account not found." });
    }

    const { token } = await this.sessions.createSession(admin.id, "demo-admin-web");

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: admin.id,
        action: "ADMIN_LOGIN",
        targetType: "ADMIN_USER",
        targetId: admin.id,
        outcome: "SUCCESS",
        metadata: { method: "demo" },
      },
    });

    const cookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: config.NODE_ENV === "production",
      maxAge: 8 * 60 * 60,
    };
    reply.setCookie(
      ADMIN_SESSION_COOKIE,
      token,
      config.APP_ENV === "local" ? { ...cookieBase, domain: "localhost" } : cookieBase,
    );

    return {
      authenticated: true,
      email: admin.email,
      displayName: admin.displayName,
      permissions: admin.permissions,
      roles: admin.roles,
    };
  }

  @Post("logout")
  @UseGuards(AdminAuthGuard)
  async logout(
    @Req() req: FastifyRequest,
    @CurrentAdmin() admin: NonNullable<Awaited<ReturnType<AdminRbacService["getAdminById"]>>>,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const token = (req.cookies as Record<string, string> | undefined)?.[ADMIN_SESSION_COOKIE];
    if (token) await this.sessions.revokeByToken(token);

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: "ADMIN",
        adminUserId: admin.id,
        action: "ADMIN_LOGOUT",
        targetType: "ADMIN_USER",
        targetId: admin.id,
        outcome: "SUCCESS",
      },
    });

    const config = getConfig();
    const clearOpts =
      config.APP_ENV === "local" ? { path: "/", domain: "localhost" } : { path: "/" };
    reply.clearCookie(ADMIN_SESSION_COOKIE, clearOpts);
    return { loggedOut: true };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: NonNullable<Awaited<ReturnType<AdminRbacService["getAdminById"]>>>) {
    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      permissions: admin.permissions,
      roles: admin.roles,
      demoMode: getConfig().DEMO_AUTH_ENABLED && getConfig().APP_ENV !== "production",
    };
  }
}
