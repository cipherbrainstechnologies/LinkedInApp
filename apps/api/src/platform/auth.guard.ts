import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { SessionService } from "./session.service.js";

const SESSION_COOKIE = "applyflow_session";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { userId?: string }>();
    const token =
      (request.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE] ??
      (request.headers["x-session-token"] as string | undefined);

    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Authentication required." });
    }

    const userId = await this.sessions.validateSession(token);
    if (!userId) {
      throw new UnauthorizedException({ code: "SESSION_INVALID", message: "Session expired or invalid." });
    }

    request.userId = userId;
    return true;
  }
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ userId: string }>();
    return request.userId;
  },
);

export { SESSION_COOKIE };
