/**
 * unavailability.service.ts
 * Full CRUD API calls for the /unavailability collection.
 * Used by providers to block off calendar time slots.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  UnavailabilityDocument,
  CreateUnavailabilityDto,
  UpdateUnavailabilityDto,
} from "@/models/api.models";

/** POST /unavailability — Create a blackout block. Roles: provider, admin. */
export async function createUnavailability(
  dto: CreateUnavailabilityDto,
): Promise<UnavailabilityDocument> {
  return apiService<UnavailabilityDocument, CreateUnavailabilityDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.UNAVAILABILITY,
    dto,
  );
}

/** GET /unavailability — All records. Roles: provider, manager, admin. */
export async function getAllUnavailability(): Promise<UnavailabilityDocument[]> {
  return apiService<UnavailabilityDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.UNAVAILABILITY);
}

/** GET /unavailability/provider/:providerId */
export async function getUnavailabilityByProvider(
  providerId: string,
): Promise<UnavailabilityDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_PROVIDER, { providerId });
  return apiService<UnavailabilityDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /unavailability/:id */
export async function getUnavailabilityById(id: string): Promise<UnavailabilityDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_ID, { id });
  return apiService<UnavailabilityDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /unavailability/:id — Roles: provider, admin. */
export async function updateUnavailability(
  id: string,
  dto: UpdateUnavailabilityDto,
): Promise<UnavailabilityDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_ID, { id });
  return apiService<UnavailabilityDocument, UpdateUnavailabilityDto>(
    HTTP_METHODS_ENUM.patch,
    url,
    dto,
  );
}

/** DELETE /unavailability/:id — Roles: provider, admin. */
export async function deleteUnavailability(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Convenience alias (matches the task spec name)
// ---------------------------------------------------------------------------

/**
 * Set a provider's availability blackout window.
 * Alias for createUnavailability for semantic clarity.
 */
export async function setAvailability(dto: CreateUnavailabilityDto): Promise<UnavailabilityDocument> {
  return createUnavailability(dto);
}
