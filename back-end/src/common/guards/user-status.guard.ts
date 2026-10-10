import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserStatus } from '../enums/user-status.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class UserStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      return true;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        `Account status is '${user.status}'. Only active accounts may perform this action.`,
      );
    }

    return true;
  }
}
