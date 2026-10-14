/**
 * payments.service.ts
 * Full CRUD API calls for the /payments collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  PaymentDocument,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "@/models/api.models";

/** POST /payments — Initialize a Razorpay payment. Requires auth. */
export async function createPayment(dto: CreatePaymentDto): Promise<PaymentDocument> {
  return apiService<PaymentDocument, CreatePaymentDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.PAYMENTS,
    dto,
  );
}

/** GET /payments — All payments. Requires auth. */
export async function getAllPayments(): Promise<PaymentDocument[]> {
  return apiService<PaymentDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.PAYMENTS);
}

/** GET /payments/order/:orderId */
export async function getPaymentByOrder(orderId: string): Promise<PaymentDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PAYMENTS_BY_ORDER, { orderId });
  return apiService<PaymentDocument>(HTTP_METHODS_ENUM.get, url);
}

/** GET /payments/:id */
export async function getPaymentById(id: string): Promise<PaymentDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PAYMENTS_BY_ID, { id });
  return apiService<PaymentDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /payments/:id — Attach razorpayPaymentId & signature after capture. */
export async function updatePayment(id: string, dto: UpdatePaymentDto): Promise<PaymentDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.PAYMENTS_BY_ID, { id });
  return apiService<PaymentDocument, UpdatePaymentDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /payments/:id */
export async function deletePayment(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.PAYMENTS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}
