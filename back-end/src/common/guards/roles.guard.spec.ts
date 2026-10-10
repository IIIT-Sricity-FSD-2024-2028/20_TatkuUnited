import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.CUSTOMER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.CUSTOMER, Role.PROVIDER]);
    const context = createMockContext({
      userId: '1',
      email: 'customer@test.com',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access to admin regardless of required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PROVIDER]);
    const context = createMockContext({
      userId: 'admin-1',
      email: 'admin@test.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);
    const context = createMockContext({
      userId: '2',
      email: 'cust@test.com',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
