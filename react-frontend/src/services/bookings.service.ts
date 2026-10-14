/**
 * bookings.service.ts
 * Full CRUD + status-action API calls for the /bookings collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  BookingDocument,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/models/api.models";

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

/** POST /bookings — Create a booking slot. Requires auth. */
export async function createBooking(dto: CreateBookingDto): Promise<BookingDocument> {
  return apiService<BookingDocument, CreateBookingDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.BOOKINGS,
    dto,
  );
}

/** GET /bookings — All bookings. Requires auth. */
export async function getAllBookings(): Promise<BookingDocument[]> {
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.BOOKINGS);
}

/** GET /bookings/customer/:customerId */
export async function getBookingsByCustomer(customerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_CUSTOMER, { customerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/provider/:providerId */
export async function getBookingsByProvider(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_PROVIDER, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/order/:orderId */
export async function getBookingsByOrder(orderId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_ORDER, { orderId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/provider/:providerId/offers — Pending offers for provider. */
export async function getProviderOffers(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_PROVIDER_OFFERS, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/provider/:providerId/schedule — Provider daily schedule. */
export async function getProviderSchedule(providerId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_PROVIDER_SCHEDULE, { providerId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/region/:regionId */
export async function getBookingsByRegion(regionId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_REGION, { regionId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/region/:regionId/problems — Unassigned / problem bookings. */
export async function getRegionProblemBookings(regionId: string): Promise<BookingDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_REGION_PROBLEMS, { regionId });
  return apiService<BookingDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /bookings/:id */
export async function getBookingById(id: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_ID, { id });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /bookings/:id */
export async function updateBooking(id: string, dto: UpdateBookingDto): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_ID, { id });
  return apiService<BookingDocument, UpdateBookingDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /bookings/:id */
export async function deleteBooking(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Status Action Endpoints
// ---------------------------------------------------------------------------

/** POST /bookings/:id/accept — Provider accepts offer. */
export async function acceptBooking(id: string, providerId?: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_ACCEPT, { id });
  return apiService<BookingDocument, { providerId?: string }>(
    HTTP_METHODS_ENUM.post,
    url,
    providerId ? { providerId } : undefined,
  );
}

/** POST /bookings/:id/reject — Provider rejects offer. */
export async function rejectBooking(id: string, providerId: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_REJECT, { id });
  return apiService<BookingDocument, { providerId: string }>(
    HTTP_METHODS_ENUM.post,
    url,
    { providerId },
  );
}

/** POST /bookings/:id/start — Provider marks job as started. */
export async function startBooking(id: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_START, { id });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.post, url);
}

/** POST /bookings/:id/complete — Provider marks job as completed. */
export async function completeBooking(id: string): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_COMPLETE, { id });
  return apiService<BookingDocument>(HTTP_METHODS_ENUM.post, url);
}

/** POST /bookings/:id/cancel — Cancel a booking. */
export async function cancelBooking(
  id: string,
  cancelledBy: string = "customer",
  reason?: string,
): Promise<BookingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.BOOKINGS_CANCEL, { id });
  return apiService<BookingDocument, { cancelledBy: string; reason?: string }>(
    HTTP_METHODS_ENUM.post,
    url,
    { cancelledBy, reason },
  );
}

// ---------------------------------------------------------------------------
// Convenience aliases (as referenced in the task spec)
// ---------------------------------------------------------------------------

/** Alias: get all bookings for the current customer. */
export async function getMyBookings(customerId: string): Promise<BookingDocument[]> {
  return getBookingsByCustomer(customerId);
}

/** Alias: update booking status field directly. */
export async function updateBookingStatus(
  id: string,
  status: BookingDocument["status"],
): Promise<BookingDocument> {
  return updateBooking(id, { status });
}
