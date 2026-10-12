import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import {type AuthInterface, type LoginResponse, type UserRegistrationInterface} from "../models/auth.models"
import { apiService } from "./apiService";
import { ENDPOINT_ENUM } from "./endpoints";

export function handleLogout() {
  sessionStorage.clear();
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
  } catch(error) {
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
  } catch(error) {
    return error.response?.data?.message || "Account creation failed";
  }
}