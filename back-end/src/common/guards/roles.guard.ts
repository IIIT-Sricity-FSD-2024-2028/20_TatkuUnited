import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { PlatformSettingsService } from '../../modules/platform-settings/platform-settings.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private platformSettings: PlatformSettingsService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const rawRoleHeader = request.headers['x-role'];
    const roleFromHeader = Array.isArray(rawRoleHeader)
      ? (rawRoleHeader[0] as Role | undefined)
      : (rawRoleHeader as Role | undefined);

    // 0. Public endpoints (login, register, etc.) always pass through
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      'isPublic',
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const currentUserRole = user?.role || roleFromHeader;

    // 1. Maintenance Mode Check
    // Skip check for SUPER_USER to allow them to fix/toggle settings
    if (currentUserRole !== Role.SUPER_USER) {
      const isMaintenance = this.platformSettings.getBooleanSetting('maintenance_mode', false);
      if (isMaintenance) {
        throw new ServiceUnavailableException(
          'Platform is currently under maintenance. Please try again later.',
        );
      }
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const normalizedRole = currentUserRole?.toLowerCase();
    const allowedRoles = requiredRoles.map(r => String(r).toLowerCase());

    if (!normalizedRole) return false;

    return allowedRoles.includes(normalizedRole);
  }
}
