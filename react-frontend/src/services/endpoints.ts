export const BASE_URL = "http://localhost:3000";

/**
 * Backend API Endpoints specification mapped directly from OpenAPI / Swagger 3.0 documentation.
 */
export const ENDPOINT_ENUM = {
  // --- System ---
  SYSTEM_HEALTH: "/",

  // --- Auth ---
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_PROFILE: "/auth/profile",

  // --- Users ---
  USERS: "/users",
  USERS_ME: "/users/me",
  USERS_BY_ROLE: "/users/role/{role}",
  USERS_BY_ID: "/users/{id}",
  USERS_ADDRESSES: "/users/{id}/addresses",
  USERS_ADDRESS_BY_ID: "/users/{id}/addresses/{addressId}",
  USERS_CART: "/users/{id}/cart",
  USERS_CART_ITEM: "/users/{id}/cart/{index}",
  USERS_CART_ADDRESS: "/users/{id}/cart/address",

  // --- Providers ---
  PROVIDERS: "/providers",
  PROVIDERS_BY_USER: "/providers/user/{userId}",
  PROVIDERS_BY_REGION: "/providers/region/{regionId}",
  PROVIDERS_BY_STATUS: "/providers/status/{status}",
  PROVIDERS_BY_SERVICE: "/providers/service/{serviceId}",
  PROVIDERS_APPROVE: "/providers/{id}/approve",
  PROVIDERS_SUSPEND: "/providers/{id}/suspend",
  PROVIDERS_BY_ID: "/providers/{id}",

  // --- Managers ---
  MANAGERS: "/managers",
  MANAGERS_BY_USER: "/managers/user/{userId}",
  MANAGERS_BY_ID: "/managers/{id}",

  // --- Regions ---
  REGIONS: "/regions",
  REGIONS_BY_MANAGER: "/regions/manager/{managerId}",
  REGIONS_BY_ID: "/regions/{id}",
  REGIONS_RECOMPUTE_CENTROID: "/regions/{id}/recompute-centroid",

  // --- Categories ---
  CATEGORIES: "/categories",
  CATEGORIES_BY_ID: "/categories/{id}",

  // --- Services Catalog ---
  SERVICES: "/services",
  SERVICES_BY_CATEGORY: "/services/category/{categoryId}",
  SERVICES_BY_ID: "/services/{id}",

  // --- Orders ---
  ORDERS: "/orders",
  ORDERS_BY_CUSTOMER: "/orders/customer/{customerId}",
  ORDERS_BY_STATUS: "/orders/status/{status}",
  ORDERS_BY_ID: "/orders/{id}",
  ORDERS_DETAILS: "/orders/{id}/details",

  // --- Bookings ---
  BOOKINGS: "/bookings",
  BOOKINGS_BY_CUSTOMER: "/bookings/customer/{customerId}",
  BOOKINGS_BY_PROVIDER: "/bookings/provider/{providerId}",
  BOOKINGS_BY_ORDER: "/bookings/order/{orderId}",
  BOOKINGS_PROVIDER_OFFERS: "/bookings/provider/{providerId}/offers",
  BOOKINGS_PROVIDER_SCHEDULE: "/bookings/provider/{providerId}/schedule",
  BOOKINGS_REGION_PROBLEMS: "/bookings/region/{regionId}/problems",
  BOOKINGS_BY_REGION: "/bookings/region/{regionId}",
  BOOKINGS_BY_ID: "/bookings/{id}",
  BOOKINGS_ACCEPT: "/bookings/{id}/accept",
  BOOKINGS_REJECT: "/bookings/{id}/reject",
  BOOKINGS_START: "/bookings/{id}/start",
  BOOKINGS_COMPLETE: "/bookings/{id}/complete",
  BOOKINGS_CANCEL: "/bookings/{id}/cancel",

  // --- Payments ---
  PAYMENTS: "/payments",
  PAYMENTS_BY_ORDER: "/payments/order/{orderId}",
  PAYMENTS_BY_ID: "/payments/{id}",

  // --- Reviews ---
  REVIEWS: "/reviews",
  REVIEWS_BY_SERVICE: "/reviews/service/{serviceId}",
  REVIEWS_BY_PROVIDER: "/reviews/provider/{providerId}",
  REVIEWS_BY_BOOKING: "/reviews/booking/{bookingId}",
  REVIEWS_BY_ID: "/reviews/{id}",

  // --- Unavailability ---
  UNAVAILABILITY: "/unavailability",
  UNAVAILABILITY_BY_PROVIDER: "/unavailability/provider/{providerId}",
  UNAVAILABILITY_BY_ID: "/unavailability/{id}",

  // --- Platform Settings ---
  PLATFORM_SETTINGS: "/platform-settings",
  PLATFORM_SETTINGS_BY_ID: "/platform-settings/{id}",
} as const;

export type EndpointEnum = (typeof ENDPOINT_ENUM)[keyof typeof ENDPOINT_ENUM];
export type ENDPOINT_TYPE = EndpointEnum | (string & {});

/**
 * Utility helper to build dynamic URL paths by substituting path parameters.
 * Supports both `{param}` (OpenAPI format) and `:param` (Express format).
 *
 * Example:
 * ```ts
 * buildEndpoint(ENDPOINT_ENUM.USERS_BY_ID, { id: "65f1a2b3c4d5e6f7a8b9c0d1" })
 * // returns "/users/65f1a2b3c4d5e6f7a8b9c0d1"
 * ```
 */
export const buildEndpoint = (
  endpoint: string,
  params: Record<string, string | number> = {}
): string => {
  let url = endpoint;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(new RegExp(`{${key}}`, "g"), encodeURIComponent(String(value)));
    url = url.replace(new RegExp(`:${key}\\b`, "g"), encodeURIComponent(String(value)));
  }
  return url;
};