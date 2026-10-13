/**
 * reviews.service.ts
 * Full CRUD API calls for the /reviews collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  ReviewDocument,
  CreateReviewDto,
  UpdateReviewDto,
} from "@/models/api.models";

/** POST /reviews — Submit a review. Roles: customer, admin. */
export async function createReview(dto: CreateReviewDto): Promise<ReviewDocument> {
  return apiService<ReviewDocument, CreateReviewDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.REVIEWS,
    dto,
  );
}

/** GET /reviews — All reviews. Public. */
export async function getAllReviews(): Promise<ReviewDocument[]> {
  return apiService<ReviewDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.REVIEWS);
}

/** GET /reviews/service/:serviceId */
export async function getReviewsByService(serviceId: string): Promise<ReviewDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_SERVICE, { serviceId });
  return apiService<ReviewDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /reviews/provider/:providerId */
export async function getReviewsByProvider(providerId: string): Promise<ReviewDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_PROVIDER, { providerId });
  return apiService<ReviewDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /reviews/booking/:bookingId */
export async function getReviewByBooking(bookingId: string): Promise<ReviewDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_BOOKING, { bookingId });
  return apiService<ReviewDocument>(HTTP_METHODS_ENUM.get, url);
}

/** GET /reviews/:id — Public. */
export async function getReviewById(id: string): Promise<ReviewDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_ID, { id });
  return apiService<ReviewDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /reviews/:id — Roles: customer, admin. */
export async function updateReview(id: string, dto: UpdateReviewDto): Promise<ReviewDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_ID, { id });
  return apiService<ReviewDocument, UpdateReviewDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /reviews/:id — Admin only. */
export async function deleteReview(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.REVIEWS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
