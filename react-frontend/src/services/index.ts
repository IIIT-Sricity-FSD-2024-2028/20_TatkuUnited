/**
 * src/services/index.ts
 * Barrel export for all API service modules.
 * Import from here for clean, single-source-of-truth imports.
 *
 * @example
 * import { getServices, createBooking, getMyBookings } from "@/services";
 */

export * from "./auth.service";
export * from "./users.service";
export * from "./providers.service";
export * from "./managers.service";
export * from "./regions.service";
export * from "./categories.service";
export * from "./services.service";
export * from "./orders.service";
export * from "./bookings.service";
export * from "./payments.service";
export * from "./reviews.service";
export * from "./unavailability.service";
export * from "./platformSettings.service";

// Explicitly re-export collided members to resolve barrel export ambiguity between providers.service and bookings.service
export { getProviderOffers, getProviderSchedule } from "./bookings.service";
