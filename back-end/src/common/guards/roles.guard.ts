import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      'isPublic',
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const roleFromJwt = user?.role;
    const rawRoleHeader = request.headers['x-role'];
    const roleFromHeader = Array.isArray(rawRoleHeader)
      ? (rawRoleHeader[0] as Role | undefined)
      : (rawRoleHeader as Role | undefined);

    if (
      roleFromHeader &&
      !Object.values(Role).includes(roleFromHeader as Role)
    ) {
      throw new ForbiddenException(`Invalid role: ${roleFromHeader}`);
    }

    if (roleFromJwt && roleFromHeader && roleFromJwt !== roleFromHeader) {
      throw new ForbiddenException('x-role header does not match JWT role');
    }

    const role = roleFromJwt || roleFromHeader;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException(
        `Required role(s): ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
