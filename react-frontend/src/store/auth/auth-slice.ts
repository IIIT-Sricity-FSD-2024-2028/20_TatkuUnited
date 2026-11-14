import { createSlice } from "@reduxjs/toolkit";
import type { UserInterface } from "@/models/auth.models";

interface AuthState {
    user: UserInterface | null;
    token: string | null;
}

function getStoredUser(): UserInterface | null {
    try {
        const raw = sessionStorage.getItem("user");
        if (!raw || raw === "undefined") return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

const initialState: AuthState = {
    user: getStoredUser(),
    token: sessionStorage.getItem("token"),
};

export const AuthSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login(state, action) {
            sessionStorage.setItem("token", action.payload.token);
            sessionStorage.setItem("user", JSON.stringify(action.payload.user));
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        logout(state) {
            sessionStorage.clear();
            state.user = null;
            state.token = null;
        }
    }
})

export const AuthActions = AuthSlice.actions;
export const AuthReducer = AuthSlice.reducer;