import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthInterface, SessionUser } from "@/models/auth.models";
import { readSession } from "@/common/services/sessionStorage";

interface AuthState {
  user: SessionUser | null;
  token: string | null;
}

const initialState: AuthState = readSession() ?? { user: null, token: null };

export const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(_state, action: PayloadAction<AuthInterface>) {
      return action.payload;
    },
    userUpdated(state, action: PayloadAction<Partial<Pick<SessionUser, "name" | "email" | "phone" | "status">>>) {
      if (state.user) Object.assign(state.user, action.payload);
    },
    logout() {
      return { user: null, token: null };
    },
  },
});

export const AuthActions = AuthSlice.actions;
export const AuthReducer = AuthSlice.reducer;
