export const RolesEnum = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type Role = (typeof RolesEnum)[keyof typeof RolesEnum];