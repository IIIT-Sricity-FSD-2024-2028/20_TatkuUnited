import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService, getApiErrorMessage } from "./apiService";
import { ENDPOINT_ENUM } from "../endpoints";
import {
  type AuthInterface,
  type LoginResponse,
  type UserRegistrationInterface,

} from "../../models/auth.models";



import { store } from "@/store";
import { AuthActions } from "@/store/auth/auth-slice";
import { fetchCustomerDetails } from "@/store/customer/customer-slice";
import { fetchManagerDetails } from "@/store/manager/manager-slice";
import { fetchSuperuserProfile, superuserActions } from "@/store/superuser/superuser-slice";
import { providerActions } from "@/store/provider/provider-slice";

export function handleLogout() {
  store.dispatch(superuserActions.resetSlice());
  store.dispatch(providerActions.resetSlice());
  store.dispatch(AuthActions.logout());
}

export function getStoredUser() {
  return store.getState().auth.user;
}

export function getStoredUserId(): string | undefined {
  const user = getStoredUser();
  return user?.id;
}

export function loadSessionProfile() {
  const { user, token } = store.getState().auth;
  if (!user || !token) return;

  if (user.role === "customer") {
    void store.dispatch(fetchCustomerDetails());
  } else if (user.role === "manager") {
    void store.dispatch(fetchManagerDetails(user.id));
  } else if (user.role === "admin") {
    void store.dispatch(fetchSuperuserProfile());
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
  } catch(error: unknown) {
    return getApiErrorMessage(error, "Login failed");
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
  } catch(error: unknown) {
    return getApiErrorMessage(error, "Account creation failed");
  }
}
