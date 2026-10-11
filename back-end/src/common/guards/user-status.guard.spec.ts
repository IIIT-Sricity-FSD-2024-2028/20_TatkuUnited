import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserStatusGuard } from './user-status.guard';
import { UserStatus } from '../enums/user-status.enum';
import { Role } from '../enums/roles.enum';

describe('UserStatusGuard', () => {
  let guard: UserStatusGuard;

  beforeEach(() => {
    guard = new UserStatusGuard();
  });

  const createMockContext = (user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no user is present in request', () => {
    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user status is ACTIVE', () => {
    const context = createMockContext({
      userId: 'user-1',
      status: UserStatus.ACTIVE,
      role: Role.CUSTOMER,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user status is BLOCKED', () => {
    const context = createMockContext({
      userId: 'user-2',
      status: UserStatus.BLOCKED,
      role: Role.CUSTOMER,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      "Account status is 'blocked'. Only active accounts may perform this action.",
    );
  });
});
