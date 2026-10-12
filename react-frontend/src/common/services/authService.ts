import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "./apiService";
import { ENDPOINT_ENUM } from "../endpoints";
import {
  type AuthInterface,
  type LoginResponse,
  type UserRegistrationInterface,
  type UserInterface,
} from "../../models/auth.models";



export function handleLogout() {
  sessionStorage.clear();
}

export function getStoredUser(): (UserInterface & { _id?: string }) | null {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredUserId(): string | undefined {
  const user = getStoredUser();
  return user?.id || user?._id;
}

export async function handleLogin(email: string, password: string): Promise<string | AuthInterface> {
  try {  
    const data: LoginResponse = await apiService(HTTP_METHODS_ENUM.post, ENDPOINT_ENUM.AUTH_LOGIN, {email, password}, (data: LoginResponse) => {
      const access_token = data.access_token;
      const user = data.user;
      sessionStorage.setItem("token", access_token);
      sessionStorage.setItem("user", JSON.stringify(user));
    });
    return {token: data.access_token, user: data.user};
  } catch(error: any) {
    return error.response?.data?.message || "Login failed";
  }
}

export async function handleRegister(userData: UserRegistrationInterface): Promise<string> {
  try{
    await apiService(
      HTTP_METHODS_ENUM.post, 
      ENDPOINT_ENUM.AUTH_REGISTER, 
      userData 
    );
    return "success";
  } catch(error: any) {
    return error.response?.data?.message || "Account creation failed";
  }
}