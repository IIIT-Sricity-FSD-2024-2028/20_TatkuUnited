/**
 * providers.service.ts
 * Full CRUD + status-action API calls for the /providers collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  ProviderDocument,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderStatus,
  BookingDocument,
} from "@/models/api.models";

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

/** POST /providers — Create provider profile. Roles: admin, provider. */
export async function createProvider(dto: CreateProviderDto): Promise<ProviderDocument> {
  return apiService<ProviderDocument, CreateProviderDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.PROVIDERS,
    dto,
  );
}

/** GET /providers — All providers. Roles: admin, manager. */
export async function getAllProviders(): Promise<ProviderDocument[]> {
  return apiService<ProviderDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.PROVIDERS);
}

/** GET /providers/user/:userId */
export async function getProviderByUser(userId: string): Promise<ProviderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_USER, { userId });
  return apiService<ProviderDocument>(HTTP_METHODS_ENUM.get, url);
}

/** GET /providers/region/:regionId */
export async function getProvidersByRegion(regionId: string): Promise<ProviderDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_REGION, { regionId });
  return apiService<ProviderDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /providers/status/:status */
export async function getProvidersByStatus(status: ProviderStatus): Promise<ProviderDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_STATUS, { status });
  return apiService<ProviderDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /providers/service/:serviceId */
export async function getProvidersByService(serviceId: string): Promise<ProviderDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_SERVICE, { serviceId });
  return apiService<ProviderDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /providers/:id */
export async function getProviderById(id: string): Promise<ProviderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_ID, { id });
  return apiService<ProviderDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /providers/:id */
export async function updateProvider(id: string, dto: UpdateProviderDto): Promise<ProviderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_ID, { id });
  return apiService<ProviderDocument, UpdateProviderDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /providers/:id — Admin only. */
export async function deleteProvider(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Status Actions
// ---------------------------------------------------------------------------

/** PATCH /providers/:id/approve — Admin / manager approve. */
export async function approveProvider(id: string): Promise<ProviderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_APPROVE, { id });
  return apiService<ProviderDocument>(HTTP_METHODS_ENUM.patch, url);
}

/** PATCH /providers/:id/suspend — Admin / manager suspend. */
export async function suspendProvider(id: string): Promise<ProviderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PROVIDERS_SUSPEND, { id });
  return apiService<ProviderDocument>(HTTP_METHODS_ENUM.patch, url);
}

// ---------------------------------------------------------------------------
// Provider-scoped Booking Queries (via bookings service endpoints)
// ---------------------------------------------------------------------------

/** GET /bookings/provider/:providerId — All assigned jobs for a provider. */
export async function getAssignedJobs(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_PROVIDER, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/provider/:providerId/offers — Pending offer bookings for a provider. */
export async function getProviderOffers(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_PROVIDER_OFFERS, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/provider/:providerId/schedule — Provider's daily schedule. */
export async function getProviderSchedule(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_PROVIDER_SCHEDULE, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /bookings/:id/accept — Provider accepts a booking offer. */
export async function acceptBookingOffer(bookingId: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_ACCEPT, { id: bookingId });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.patch, url);
}

/** PATCH /bookings/:id/reject — Provider rejects a booking offer. */
export async function rejectBookingOffer(bookingId: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_REJECT, { id: bookingId });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.patch, url);
}

/** PATCH /bookings/:id/start — Provider marks a job as started. */
export async function startJob(bookingId: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_START, { id: bookingId });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.patch, url);
}

/** PATCH /bookings/:id/complete — Provider marks a job as completed. */
export async function completeJob(bookingId: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_COMPLETE, { id: bookingId });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.patch, url);
}
