import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "./apiService";
import { ENDPOINT_ENUM } from "../endpoints";
import {
  type AuthInterface,
  type LoginResponse,
  type UserRegistrationInterface,
  type UserInterface,
} from "../../models/auth.models";



import { store } from "@/store";
import { AuthActions } from "@/store/auth/auth-slice";
import { fetchCustomerDetails } from "@/store/customer/customer-slice";
import { fetchManagerDetails } from "@/store/manager/manager-slice";
import { superuserActions } from "@/store/superuser/superuser-slice";
import { providerActions } from "@/store/provider/provider-slice";
import { providerApi } from "@/store/provider/provider-api";

export function handleLogout() {
  store.dispatch(superuserActions.resetSlice());
  store.dispatch(providerActions.resetSlice());
  store.dispatch(providerApi.util.resetApiState());
  store.dispatch(AuthActions.logout());
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

export function loadSessionProfile() {
  const { user, token } = store.getState().auth;
  if (!user || !token) return;

  if (user.role === "customer") {
    void store.dispatch(fetchCustomerDetails());
  } else if (user.role === "manager") {
    void store.dispatch(fetchManagerDetails(user.id));
  }
}

export async function handleLogin(email: string, password: string): Promise<string | AuthInterface> {
  try {  
    const data: LoginResponse = await apiService(HTTP_METHODS_ENUM.post, ENDPOINT_ENUM.AUTH_LOGIN, {email, password}, (data: LoginResponse) => {
      const access_token = data.access_token;
      const user = data.user;

      store.dispatch(AuthActions.login({ user, token: access_token }));
      loadSessionProfile();
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
