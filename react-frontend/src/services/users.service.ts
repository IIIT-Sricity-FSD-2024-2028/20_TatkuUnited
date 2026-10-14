/**
 * users.service.ts
 * Full CRUD + sub-resource API calls for the /users collection.
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type {
  UserDocument,
  CreateUserDto,
  UpdateUserDto,
  UserAddress,
  BackendCart,
  AddCartItemDto,
  UserRole,
} from "@/models/api.models";

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

/** POST /users — Create a new user (public, but role-restricted for admin/manager). */
export async function createUser(dto: CreateUserDto): Promise<UserDocument> {
  return apiService<UserDocument, CreateUserDto>(
    HTTP_METHODS_ENUM.post,
    ENDPOINT_ENUM.USERS,
    dto,
  );
}

/** GET /users — List all users. Requires admin role. */
export async function getAllUsers(): Promise<UserDocument[]> {
  return apiService<UserDocument[]>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.USERS);
}

/** GET /users/me — Current authenticated user profile. */
export async function getMe(): Promise<UserDocument> {
  return apiService<UserDocument>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.USERS_ME);
}

/** GET /users/role/:role — All users filtered by role. Admin only. */
export async function getUsersByRole(role: UserRole): Promise<UserDocument[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_BY_ROLE, { role });
  return apiService<UserDocument[]>(HTTP_METHODS_ENUM.get, url);
}

/** GET /users/:id */
export async function getUserById(id: string): Promise<UserDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_BY_ID, { id });
  return apiService<UserDocument>(HTTP_METHODS_ENUM.get, url);
}

/** PATCH /users/:id */
export async function updateUser(id: string, dto: UpdateUserDto): Promise<UserDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_BY_ID, { id });
  return apiService<UserDocument, UpdateUserDto>(HTTP_METHODS_ENUM.patch, url, dto);
}

/** DELETE /users/:id — Admin only. */
export async function deleteUser(id: string): Promise<void> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_BY_ID, { id });
  return apiService<void>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Address Sub-resource
// ---------------------------------------------------------------------------

/** GET /users/:id/addresses */
export async function getUserAddresses(id: string): Promise<UserAddress[]> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_ADDRESSES, { id });
  return apiService<UserAddress[]>(HTTP_METHODS_ENUM.get, url);
}

/** POST /users/:id/addresses */
export async function addUserAddress(id: string, address: UserAddress): Promise<UserDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_ADDRESSES, { id });
  return apiService<UserDocument, UserAddress>(HTTP_METHODS_ENUM.post, url, address);
}

/** PATCH /users/:id/addresses/:addressId */
export async function updateUserAddress(
  id: string,
  addressId: string,
  address: Partial<UserAddress>,
): Promise<UserDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_ADDRESS_BY_ID, { id, addressId });
  return apiService<UserDocument, Partial<UserAddress>>(HTTP_METHODS_ENUM.patch, url, address);
}

/** DELETE /users/:id/addresses/:addressId */
export async function deleteUserAddress(id: string, addressId: string): Promise<UserDocument> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_ADDRESS_BY_ID, { id, addressId });
  return apiService<UserDocument>(HTTP_METHODS_ENUM.delete, url);
}

// ---------------------------------------------------------------------------
// Cart Sub-resource
// ---------------------------------------------------------------------------

/** GET /users/:id/cart */
export async function getUserCart(id: string): Promise<BackendCart> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_CART, { id });
  return apiService<BackendCart>(HTTP_METHODS_ENUM.get, url);
}

/** POST /users/:id/cart — Add item to cart. */
export async function addCartItem(id: string, item: AddCartItemDto): Promise<BackendCart> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_CART, { id });
  return apiService<BackendCart, AddCartItemDto>(HTTP_METHODS_ENUM.post, url, item);
}

/** PATCH /users/:id/cart/address — Set cart delivery address. */
export async function setCartAddress(id: string, addressId: string): Promise<BackendCart> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_CART_ADDRESS, { id });
  return apiService<BackendCart, { addressId: string }>(HTTP_METHODS_ENUM.patch, url, { addressId });
}

/** DELETE /users/:id/cart/:index — Remove cart item by index. */
export async function removeCartItem(id: string, index: number): Promise<BackendCart> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_CART_ITEM, { id, index });
  return apiService<BackendCart>(HTTP_METHODS_ENUM.delete, url);
}

/** DELETE /users/:id/cart — Clear all items from cart. */
export async function clearCart(id: string): Promise<BackendCart> {
  const url = buildEndpoint(ENDPOINT_ENUM.USERS_CART, { id });
  return apiService<BackendCart>(HTTP_METHODS_ENUM.delete, url);
}
