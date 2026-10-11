import axios from "axios";
import {type AuthInterface, type LoginResponse, type UserRegistrationInterface} from "../models/auth.models"
import { BASE_URL } from "./api";

export function handleLogout() {
    sessionStorage.clear();
}

export async function handleLogin(email: string, password: string): Promise<string | AuthInterface> {
    try {
    const response = await axios.post<LoginResponse>(
      `${BASE_URL}/auth/login`,
      {email, password},
    );
    const access_token = response.data.access_token;
    const user = response.data.user;
    sessionStorage.setItem("token", access_token);
    sessionStorage.setItem("user", JSON.stringify(user));
    return {token: access_token, user: user}
  } catch (error: any) {
    return error.response?.data?.message || "Login error: Invalid email or password";
  }
}

export async function handleRegister(userData: UserRegistrationInterface): Promise<string> {
  try {
    await axios.post(`${BASE_URL}/auth/register`, userData);
    return "success";
  } catch (error) {
    return error.response?.data?.message || "Registration failed";
  }
}