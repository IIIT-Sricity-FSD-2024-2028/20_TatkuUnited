import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserStatus } from '../enums/user-status.enum';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException(
        'Bearer token missing in authorization header',
      );
    }

    const payload = await this.authService.verifyToken(token);

    // Verify account status
    if (payload.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Your account has been blocked. Contact support.',
      );
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: payload.sub,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      status: payload.status,
    };

    (request as any).user = authenticatedUser;
    return true;
  }
}
