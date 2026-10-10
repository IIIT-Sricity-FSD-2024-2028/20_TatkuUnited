import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, ROLE_PERMISSIONS } from '../enums/permissions.enum';
import { Role } from '../enums/roles.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific permissions are required, pass through
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Admin has all permissions
    if (user.role === Role.ADMIN) {
      return true;
    }

    const userRolePermissions = ROLE_PERMISSIONS[user.role] || [];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userRolePermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      const missing = requiredPermissions.filter(
        (perm) => !userRolePermissions.includes(perm),
      );
      throw new ForbiddenException(
        `Access denied. Missing required permission(s): [${missing.join(', ')}]`,
      );
    }

    return true;
  }
}
