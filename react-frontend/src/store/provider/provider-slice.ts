import { createSlice, isPending, isFulfilled, isRejected, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";

interface ProviderState {

}

const initialState: ProviderState = {

}

const ProviderSlice = createSlice({
    name: "provider",
    initialState,
    reducers: {
        resetSlice: () => initialState,
    },
})

export const providerReducer = ProviderSlice.reducer;
export const providerActions = ProviderSlice.actions;
