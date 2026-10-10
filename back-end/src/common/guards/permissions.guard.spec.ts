import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { Role } from '../enums/roles.enum';
import { Permission } from '../enums/permissions.enum';
import { UserStatus } from '../enums/user-status.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.CUSTOMER });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if role has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.ORDER_CREATE, Permission.ORDER_PAY]);
    const context = createMockContext({
      userId: '1',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if role lacks one of the required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.CATALOGUE_MANAGE]);
    const context = createMockContext({
      userId: '1',
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should grant admin all permissions unconditionally', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([
        Permission.CATALOGUE_MANAGE,
        Permission.USER_MANAGE_ALL,
        Permission.SETTINGS_MANAGE,
      ]);
    const context = createMockContext({
      userId: 'admin-1',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});
