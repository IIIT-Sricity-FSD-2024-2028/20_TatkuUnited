import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from '../../auth/auth.service';
import { Role } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(() => {
    reflector = new Reflector();
    authService = {
      verifyToken: jest.fn(),
    };
    guard = new JwtAuthGuard(reflector, authService as unknown as AuthService);
  });

  const createMockContext = (
    headers: Record<string, string> = {},
  ): {
    context: ExecutionContext;
    request: any;
  } => {
    const request: any = { headers };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  it('should allow access if route is decorated with @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext();

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should throw UnauthorizedException if Authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is required'),
    );
  });

  it('should throw UnauthorizedException if Authorization header does not start with Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Basic 123456' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is required'),
    );
  });

  it('should throw UnauthorizedException if Bearer token is empty', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Bearer   ' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Bearer token missing in authorization header'),
    );
  });

  it('should throw UnauthorizedException if authService.verifyToken rejects', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    (authService.verifyToken as jest.Mock).mockRejectedValue(
      new UnauthorizedException('Invalid or expired authentication token'),
    );
    const { context } = createMockContext({
      authorization: 'Bearer bad.token.here',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user status is BLOCKED', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    (authService.verifyToken as jest.Mock).mockResolvedValue({
      sub: 'blocked-user-id',
      email: 'blocked@example.com',
      role: Role.CUSTOMER,
      status: UserStatus.BLOCKED,
    });
    const { context } = createMockContext({
      authorization: 'Bearer valid.blocked.token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Your account has been blocked. Contact support.',
      ),
    );
  });

  it('should attach user payload to request and allow access for valid active user', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    (authService.verifyToken as jest.Mock).mockResolvedValue({
      sub: 'user-789',
      email: 'active@example.com',
      phone: '+919999999999',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    const { context, request } = createMockContext({
      authorization: 'Bearer valid.active.token',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      userId: 'user-789',
      email: 'active@example.com',
      phone: '+919999999999',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
  });
});
