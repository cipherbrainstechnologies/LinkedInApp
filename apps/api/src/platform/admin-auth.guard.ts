import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { getConfig } from "@applyflow/config";
import { AdminRbacService } from "./admin-rbac.service.js";
import { AdminSessionService, ADMIN_SESSION_COOKIE } from "./admin-session.service.js";

export const ADMIN_PERMISSION_KEY = "admin_permission";

export const RequireAdminPermission = (permission: string) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: AdminSessionService,
    private readonly rbac: AdminRbacService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & { adminUserId?: string; admin?: Awaited<ReturnType<AdminRbacService["getAdminById"]>> }
    >();

    const config = getConfig();
    let adminUserId: string | null = null;

    const cookieToken = (request.cookies as Record<string, string> | undefined)?.[ADMIN_SESSION_COOKIE];
    if (cookieToken) {
      adminUserId = await this.sessions.validateSession(cookieToken);
    }

    // Demo-only header fallback for migration; disabled in production
    if (!adminUserId && config.APP_ENV !== "production" && config.DEMO_AUTH_ENABLED) {
      const headerEmail = request.headers["x-admin-email"] as string | undefined;
      if (headerEmail) {
        const admin = await this.rbac.getAdminByEmail(headerEmail);
        adminUserId = admin?.id ?? null;
      }
    }

    if (!adminUserId) {
      throw new UnauthorizedException({ code: "ADMIN_UNAUTHORIZED", message: "Admin authentication required." });
    }

    const admin = await this.rbac.getAdminById(adminUserId);
    if (!admin) {
      throw new UnauthorizedException({ code: "ADMIN_UNAUTHORIZED", message: "Admin session invalid." });
    }

    const permission = this.reflector.get<string>(ADMIN_PERMISSION_KEY, context.getHandler());
    if (permission && !admin.permissions.includes(permission)) {
      throw new ForbiddenException({ code: "ADMIN_FORBIDDEN", message: "Permission denied." });
    }

    request.adminUserId = adminUserId;
    request.admin = admin;
    return true;
  }
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ admin: NonNullable<Awaited<ReturnType<AdminRbacService["getAdminById"]>>> }>();
    return request.admin;
  },
);

export const CurrentAdminId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ adminUserId: string }>();
    return request.adminUserId;
  },
);
