/**
 * orders.service.ts
 * Full CRUD API calls for the /orders collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  OrderDocument,
  CreateOrderDto,
  UpdateOrderDto,
  OrderPaymentStatus,
} from "@/models/api.models";

/** POST /orders — Create a new checkout order. Requires auth. */
export async function createOrder(dto: CreateOrderDto): Promise<OrderDocument> {
  return apiService<OrderDocument, CreateOrderDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.ORDERS,
    dto,
  );
}

/** GET /orders — All orders. Requires auth (admin sees all, customers see own). */
export async function getAllOrders(): Promise<OrderDocument[]> {
  return apiService<OrderDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.ORDERS);
}

/** GET /orders/customer/:customerId — Orders for a specific customer. */
export async function getOrdersByCustomer(customerId: string): Promise<OrderDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_BY_CUSTOMER, { customerId });
  return apiService<OrderDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /orders/status/:status — Orders filtered by payment status. */
export async function getOrdersByStatus(status: OrderPaymentStatus): Promise<OrderDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_BY_STATUS, { status });
  return apiService<OrderDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /orders/:id */
export async function getOrderById(id: string): Promise<OrderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_BY_ID, { id });
  return apiService<OrderDocument>(HTTP_METHODS_ENUM.get, url);
}

/** GET /orders/:id/details — Enriched order details with bookings. */
export async function getOrderDetails(id: string): Promise<OrderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_DETAILS, { id });
  return apiService<OrderDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /orders/:id — Update payment status / attach payment. */
export async function updateOrder(id: string, dto: UpdateOrderDto): Promise<OrderDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_BY_ID, { id });
  return apiService<OrderDocument, UpdateOrderDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /orders/:id */
export async function deleteOrder(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.ORDERS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Alias: fetch the authenticated user's order history. Pass the current user's ID. */
export async function getOrderHistory(customerId: string): Promise<OrderDocument[]> {
  return getOrdersByCustomer(customerId);
}
