/**
 * services.service.ts
 * Full CRUD API calls for the /services (catalog) collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  ServiceDocument,
  CreateServiceDto,
  UpdateServiceDto,
} from "@/models/api.models";

/** POST /services — Admin only. */
export async function createService(dto: CreateServiceDto): Promise<ServiceDocument> {
  return apiService<ServiceDocument, CreateServiceDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.SERVICES,
    dto,
  );
}

/** GET /services — All services catalog. Public. */
export async function getServices(): Promise<ServiceDocument[]> {
  return apiService<ServiceDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.SERVICES);
}

/** GET /services/category/:categoryId — Filter by category. Public. */
export async function getServicesByCategory(categoryId: string): Promise<ServiceDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.SERVICES_BY_CATEGORY, { categoryId });
  return apiService<ServiceDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /services/:id — Public. */
export async function getServiceById(id: string): Promise<ServiceDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.SERVICES_BY_ID, { id });
  return apiService<ServiceDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /services/:id — Admin only. */
export async function updateService(id: string, dto: UpdateServiceDto): Promise<ServiceDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.SERVICES_BY_ID, { id });
  return apiService<ServiceDocument, UpdateServiceDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /services/:id — Admin only. */
export async function deleteService(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.SERVICES_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
