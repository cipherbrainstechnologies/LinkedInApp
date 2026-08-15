import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getConfig } from "@applyflow/config";
import { AuthService } from "./auth.service.js";
import { AuthGuard, CurrentUserId, SESSION_COOKIE } from "../../platform/auth.guard.js";
import { UseGuards } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("oidc/start")
  async oidcStart(
    @Query("platform") platform?: "web" | "mobile",
    @Query("returnTo") returnTo?: string,
  ) {
    return this.auth.startOidc(platform ?? "web", returnTo);
  }

  @Get("oidc/callback")
  async oidcCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.handleOidcCallback(code, state);
    const config = getConfig();

    if ("error" in result) {
      return reply.redirect(`${config.WEB_URL}/login?error=${encodeURIComponent(result.code)}`, 302);
    }

    if (result.accessToken) {
      return result;
    }

    if (result.sessionToken) {
      reply.setCookie(SESSION_COOKIE, result.sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: config.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    const webUrl = config.WEB_URL;
    if (result.needsEmailVerification) {
      return reply.redirect(`${webUrl}/verify-email`, 302);
    }
    const dest = result.returnTo?.startsWith("/") ? `${webUrl}${result.returnTo}` : `${webUrl}/home`;
    return reply.redirect(dest, 302);
  }

  @Get("linkedin/start")
  async linkedinStart(@Query("returnTo") returnTo?: string) {
    const config = getConfig();
    if (!config.LINKEDIN_OIDC_ENABLED) {
      return this.auth.startOidc("web", returnTo);
    }
    return { message: "LinkedIn OIDC not configured in demo; use /auth/oidc/start" };
  }

  @Get("linkedin/callback")
  async linkedinCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.oidcCallback(code, state, reply);
  }

  @Post("email/start")
  @UseGuards(AuthGuard)
  async emailStart(@CurrentUserId() userId: string, @Body() body: { email: string }) {
    return this.auth.startEmailVerification(userId, body.email);
  }

  @Post("email/verify")
  @UseGuards(AuthGuard)
  async emailVerify(@CurrentUserId() userId: string, @Body() body: { code: string }) {
    return this.auth.verifyEmail(userId, body.code);
  }

  @Post("token/refresh")
  async tokenRefresh(@Body() body: { refreshToken: string }) {
    return this.auth.refreshTokens(body.refreshToken);
  }

  @Get("demo/personas")
  getPersonas() {
    return { personas: this.auth.getDemoPersonas() };
  }

  @Post("demo/login")
  async demoLogin(
    @Body() body: { personaId: string },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { userId, token } = await this.auth.demoLogin(body.personaId);
    const config = getConfig();

    reply.setCookie(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
    });

    return { userId, authenticated: true };
  }

  @Post("logout")
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (token) {
      await this.auth.logout(token);
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { loggedOut: true };
  }
}

@Controller("sessions")
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.auth.listSessions(userId);
  }

  @Delete(":id")
  revoke(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.auth.revokeSession(userId, id);
  }
}
