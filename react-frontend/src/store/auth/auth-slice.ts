import { createSlice } from "@reduxjs/toolkit";
import type { Role } from "../../common/roles.enum";

export interface UserInterface {
    id: string;
    name: string;
    email: string;
    role: Role;
}

interface AuthState {
    user: UserInterface | null;
    token: string | null;
}

const initialState: AuthState = {
    user: sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user") || "{}") : null,
    token: sessionStorage.getItem("token"),
}

export const AuthSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        logout(state) {
            state.user = null;
            state.token = null;
        }
    }
})

export const AuthActions = AuthSlice.actions;
export const AuthReducer = AuthSlice.reducer;