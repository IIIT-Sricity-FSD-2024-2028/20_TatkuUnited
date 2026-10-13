/**
 * regions.service.ts
 * Full CRUD API calls for the /regions collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  RegionDocument,
  CreateRegionDto,
  UpdateRegionDto,
} from "@/models/api.models";

/** POST /regions — Create region. Admin only. */
export async function createRegion(dto: CreateRegionDto): Promise<RegionDocument> {
  return apiService<RegionDocument, CreateRegionDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.REGIONS,
    dto,
  );
}

/** GET /regions — All regions. Public. */
export async function getAllRegions(): Promise<RegionDocument[]> {
  return apiService<RegionDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.REGIONS);
}

/** GET /regions/manager/:managerId */
export async function getRegionsByManager(managerId: string): Promise<RegionDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.REGIONS_BY_MANAGER, { managerId });
  return apiService<RegionDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /regions/:id — Public. */
export async function getRegionById(id: string): Promise<RegionDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REGIONS_BY_ID, { id });
  return apiService<RegionDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /regions/:id — Roles: admin, manager. */
export async function updateRegion(id: string, dto: UpdateRegionDto): Promise<RegionDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REGIONS_BY_ID, { id });
  return apiService<RegionDocument, UpdateRegionDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /regions/:id — Admin only. */
export async function deleteRegion(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.REGIONS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

/** POST /regions/:id/recompute-centroid — Recalculate region centroid. */
export async function recomputeRegionCentroid(id: string): Promise<RegionDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REGIONS_RECOMPUTE_CENTROID, { id });
  return apiService<RegionDocument>(HTTP_METHODS_ENUM.post, url);
}
