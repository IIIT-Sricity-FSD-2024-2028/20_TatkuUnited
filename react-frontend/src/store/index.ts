import { configureStore } from "@reduxjs/toolkit";
import { AuthReducer } from "./auth/auth-slice";
import { ManagerReducer } from "./manager/manager-slice";

export const store = configureStore({
    reducer: {
        auth: AuthReducer,
        manager: ManagerReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;