/**
 * platformSettings.service.ts
 * Full CRUD API calls for the /platform-settings collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  PlatformSettingDocument,
  CreatePlatformSettingDto,
  UpdatePlatformSettingDto,
} from "@/models/api.models";

/** POST /platform-settings — Admin only. */
export async function createPlatformSetting(
  dto: CreatePlatformSettingDto,
): Promise<PlatformSettingDocument> {
  return apiService<PlatformSettingDocument, CreatePlatformSettingDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.PLATFORM_SETTINGS,
    dto,
  );
}

/** GET /platform-settings — Public. */
export async function getAllPlatformSettings(): Promise<PlatformSettingDocument[]> {
  return apiService<PlatformSettingDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.PLATFORM_SETTINGS);
}

/** GET /platform-settings/:id — Public. */
export async function getPlatformSettingById(id: string): Promise<PlatformSettingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PLATFORM_SETTINGS_BY_ID, { id });
  return apiService<PlatformSettingDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /platform-settings/:id — Admin only. */
export async function updatePlatformSetting(
  id: string,
  dto: UpdatePlatformSettingDto,
): Promise<PlatformSettingDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PLATFORM_SETTINGS_BY_ID, { id });
  return apiService<PlatformSettingDocument, UpdatePlatformSettingDto>(
    HTTP_METHODS_ENUM.patch,
    url,
    dto,
  );
}

/** DELETE /platform-settings/:id — Admin only. */
export async function deletePlatformSetting(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.PLATFORM_SETTINGS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
