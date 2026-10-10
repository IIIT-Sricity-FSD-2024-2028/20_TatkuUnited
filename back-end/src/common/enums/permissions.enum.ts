import { Role } from './roles.enum';

export enum Permission {
  // Profile & Addresses & Cart
  PROFILE_MANAGE_OWN = 'profile:manage:own',
  CART_MANAGE_OWN = 'cart:manage:own',

  // Orders
  ORDER_CREATE = 'order:create',
  ORDER_PAY = 'order:pay',
  ORDER_VIEW_OWN = 'order:view:own',
  ORDER_VIEW_ALL = 'order:view:all',

  // Bookings
  BOOKING_VIEW_OWN = 'booking:view:own',
  BOOKING_VIEW_REGION = 'booking:view:region',
  BOOKING_VIEW_ALL = 'booking:view:all',
  BOOKING_CANCEL_OWN = 'booking:cancel:own',
  BOOKING_CANCEL_REGION = 'booking:cancel:region',
  BOOKING_CANCEL_ALL = 'booking:cancel:all',

  // Jobs (Providers)
  JOB_OFFER_RESPOND = 'job:offer:respond', // accept or reject offer
  JOB_START_COMPLETE = 'job:start_complete', // in_progress, completed
  JOB_STATUS_OVERRIDE = 'job:status:override', // manager/admin override

  // Reviews
  REVIEW_CREATE_OWN = 'review:create:own',
  REVIEW_VIEW = 'review:view',

  // Unavailability
  UNAVAILABILITY_MANAGE_OWN = 'unavailability:manage:own',

  // Providers management
  PROVIDER_APPROVE_SUSPEND_REGION = 'provider:approve_suspend:region',
  PROVIDER_APPROVE_SUSPEND_ALL = 'provider:approve_suspend:all',
  PROVIDER_PROFILE_MANAGE_OWN = 'provider:profile:manage:own',

  // Platform Administration
  CATALOGUE_MANAGE = 'catalogue:manage',
  REGION_MANAGE = 'region:manage',
  MANAGER_MANAGE = 'manager:manage',
  SETTINGS_MANAGE = 'settings:manage',
  USER_MANAGE_ALL = 'user:manage:all',

  // Financial overrides
  REFUND_TRIGGER_MANUAL = 'refund:trigger:manual',
  PAYOUT_TRIGGER_MANUAL = 'payout:trigger:manual',
}

/**
 * Standard Role-to-Permissions matrix based on Home Services Platform requirements
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.CUSTOMER]: [
    Permission.PROFILE_MANAGE_OWN,
    Permission.CART_MANAGE_OWN,
    Permission.ORDER_CREATE,
    Permission.ORDER_PAY,
    Permission.ORDER_VIEW_OWN,
    Permission.BOOKING_VIEW_OWN,
    Permission.BOOKING_CANCEL_OWN,
    Permission.REVIEW_CREATE_OWN,
    Permission.REVIEW_VIEW,
  ],

  [Role.PROVIDER]: [
    Permission.PROFILE_MANAGE_OWN,
    Permission.PROVIDER_PROFILE_MANAGE_OWN,
    Permission.BOOKING_VIEW_OWN,
    Permission.BOOKING_CANCEL_OWN,
    Permission.JOB_OFFER_RESPOND,
    Permission.JOB_START_COMPLETE,
    Permission.UNAVAILABILITY_MANAGE_OWN,
    Permission.REVIEW_VIEW,
  ],

  [Role.MANAGER]: [
    Permission.PROFILE_MANAGE_OWN,
    Permission.BOOKING_VIEW_REGION,
    Permission.BOOKING_CANCEL_REGION,
    Permission.JOB_STATUS_OVERRIDE,
    Permission.PROVIDER_APPROVE_SUSPEND_REGION,
    Permission.REFUND_TRIGGER_MANUAL,
    Permission.REVIEW_VIEW,
  ],

  [Role.ADMIN]: Object.values(Permission),
};
