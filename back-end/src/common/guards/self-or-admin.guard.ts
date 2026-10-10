import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Ensures that if a route parameter 'id' or 'userId' is supplied,
 * a non-admin/non-manager caller can only access/modify their own resource.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Admin always has bypass privilege
    if (user.role === Role.ADMIN) {
      return true;
    }

    const targetId = request.params?.id || request.params?.userId;
    if (targetId && targetId !== user.userId) {
      throw new ForbiddenException(
        'Access denied. You can only access your own resource.',
      );
    }

    return true;
  }
}
