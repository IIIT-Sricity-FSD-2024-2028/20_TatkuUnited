import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SelfOrAdminGuard } from './self-or-admin.guard';
import { Role } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

describe('SelfOrAdminGuard', () => {
  let guard: SelfOrAdminGuard;

  beforeEach(() => {
    guard = new SelfOrAdminGuard();
  });

  const createMockContext = (
    user?: any,
    params: Record<string, string> = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as unknown as ExecutionContext;

  it('should throw ForbiddenException if user is not authenticated', () => {
    const context = createMockContext(undefined, { id: 'user-1' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'User is not authenticated',
    );
  });

  it('should allow access to admin regardless of target resource ID', () => {
    const context = createMockContext(
      {
        userId: 'admin-id',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
      { id: 'target-other-user-id' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if params.id matches user.userId', () => {
    const context = createMockContext(
      {
        userId: 'user-123',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      { id: 'user-123' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if params.userId matches user.userId', () => {
    const context = createMockContext(
      {
        userId: 'provider-456',
        role: Role.PROVIDER,
        status: UserStatus.ACTIVE,
      },
      { userId: 'provider-456' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if params.id belongs to someone else and user is not admin', () => {
    const context = createMockContext(
      {
        userId: 'user-123',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      { id: 'someone-else-id' },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Access denied. You can only access your own resource.',
    );
  });

  it('should allow access if no target id/userId param is present', () => {
    const context = createMockContext(
      {
        userId: 'user-123',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      {},
    );
    expect(guard.canActivate(context)).toBe(true);
  });
});
