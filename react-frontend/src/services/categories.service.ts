/**
 * categories.service.ts
 * Full CRUD API calls for the /categories collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  CategoryDocument,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/models/api.models";

/** POST /categories — Admin only. */
export async function createCategory(dto: CreateCategoryDto): Promise<CategoryDocument> {
  return apiService<CategoryDocument, CreateCategoryDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.CATEGORIES,
    dto,
  );
}

/** GET /categories — Public. */
export async function getCategories(): Promise<CategoryDocument[]> {
  return apiService<CategoryDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.CATEGORIES);
}

/** GET /categories/:id — Public. */
export async function getCategoryById(id: string): Promise<CategoryDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.CATEGORIES_BY_ID, { id });
  return apiService<CategoryDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /categories/:id — Admin only. */
export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.CATEGORIES_BY_ID, { id });
  return apiService<CategoryDocument, UpdateCategoryDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /categories/:id — Admin only. */
export async function deleteCategory(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.CATEGORIES_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
