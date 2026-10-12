/**
 * managers.service.ts
 * Full CRUD API calls for the /managers collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  ManagerDocument,
  CreateManagerDto,
  UpdateManagerDto,
} from "@/models/api.models";

/** POST /managers — Create manager. Admin only. */
export async function createManager(dto: CreateManagerDto): Promise<ManagerDocument> {
  return apiService<ManagerDocument, CreateManagerDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.MANAGERS,
    dto,
  );
}

/** GET /managers — All managers. Admin only. */
export async function getAllManagers(): Promise<ManagerDocument[]> {
  return apiService<ManagerDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.MANAGERS);
}

/** GET /managers/user/:userId */
export async function getManagerByUser(userId: string): Promise<ManagerDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.MANAGERS_BY_USER, { userId });
  return apiService<ManagerDocument>(HTTP_METHODS_ENUM.get, url);
}

/** GET /managers/:id */
export async function getManagerById(id: string): Promise<ManagerDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.MANAGERS_BY_ID, { id });
  return apiService<ManagerDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /managers/:id */
export async function updateManager(id: string, dto: UpdateManagerDto): Promise<ManagerDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.MANAGERS_BY_ID, { id });
  return apiService<ManagerDocument, UpdateManagerDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /managers/:id — Admin only. */
export async function deleteManager(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.MANAGERS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
