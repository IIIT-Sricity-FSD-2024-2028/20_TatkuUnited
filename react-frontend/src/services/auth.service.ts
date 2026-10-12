/**
 * auth.service.ts
 * Authentication API calls: login, register, profile
 */
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import type { LoginResponse, UserInterface, UserRegistrationInterface } from "@/models/auth.models";

// Re-export helpers so callers import from one place
export { handleLogin, handleLogout, handleRegister, getStoredUser, getStoredUserId } from "@/common/services/authService";

/** GET /auth/profile — current authenticated user */
export async function getAuthProfile(): Promise<UserInterface> {
  return apiService<UserInterface>(HTTP_METHODS_ENUM.get, ENDPOINT_ENUM.AUTH_PROFILE);
}
