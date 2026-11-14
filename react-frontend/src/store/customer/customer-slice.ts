import type { User } from "@/schema";
import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getMe } from "@/services/users.service";
import { AuthActions } from "../auth/auth-slice";

interface CustomerState {
    profile: User | null;
    requestId: string | null;
    error: string | null;
}

const initialState: CustomerState = {
    profile: null,
    requestId: null,
    error: null,
};

export const fetchCustomerDetails = createAsyncThunkTyped(
    "customer/fetchCustomerDetails",
    () => getMe()
)

const CustomerSlice = createSlice({
    name: "customer",
    initialState,
    reducers: {
        resetSlice: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(AuthActions.login, () => initialState)
            .addCase(AuthActions.logout, () => initialState)
            .addCase(fetchCustomerDetails.pending, (state, action) => {
                state.requestId = action.meta.requestId;
                state.error = null;
            })
            .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
                if (state.requestId !== action.meta.requestId) return;
                state.profile = action.payload;
                state.requestId = null;
            })
            .addCase(fetchCustomerDetails.rejected, (state, action) => {
                if (state.requestId !== action.meta.requestId) return;
                state.requestId = null;
                if (!action.meta.aborted) {
                    state.error = action.error.message ?? "Fetching customer details failed";
                }
            });
    }
})

export const customerReducer = CustomerSlice.reducer;
export const customerActions = CustomerSlice.actions;
