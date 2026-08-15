import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

export type AdminPrincipal = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  roles: string[];
};

@Injectable()
export class AdminRbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminByEmail(email: string): Promise<AdminPrincipal | null> {
    const admin = await this.prisma.client.adminUser.findFirst({
      where: { email, status: "ACTIVE" },
      include: {
        roleAssignments: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!admin) return null;
    return this.toPrincipal(admin);
  }

  async getAdminById(adminUserId: string): Promise<AdminPrincipal | null> {
    const admin = await this.prisma.client.adminUser.findFirst({
      where: { id: adminUserId, status: "ACTIVE" },
      include: {
        roleAssignments: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!admin) return null;
    return this.toPrincipal(admin);
  }

  async requirePermission(adminUserId: string, permission: string): Promise<AdminPrincipal> {
    const admin = await this.getAdminById(adminUserId);
    if (!admin) {
      throw new UnauthorizedException({ code: "ADMIN_UNAUTHORIZED", message: "Admin session invalid." });
    }
    if (!admin.permissions.includes(permission)) {
      throw new ForbiddenException({ code: "ADMIN_FORBIDDEN", message: "Permission denied." });
    }
    return admin;
  }

  private toPrincipal(
    admin: {
      id: string;
      email: string;
      displayName: string;
      roleAssignments: Array<{
        role: {
          name: string;
          permissions: Array<{ permission: { code: string } }>;
        };
      }>;
    },
  ): AdminPrincipal {
    const permissions = admin.roleAssignments.flatMap((a) =>
      a.role.permissions.map((p) => p.permission.code),
    );
    const roles = admin.roleAssignments.map((a) => a.role.name);
    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      permissions: [...new Set(permissions)],
      roles: [...new Set(roles)],
    };
  }
}
