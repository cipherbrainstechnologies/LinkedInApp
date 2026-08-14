import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getConfig } from "@applyflow/config";
import { AuthService } from "./auth.service.js";
import { SESSION_COOKIE } from "../../platform/auth.guard.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
