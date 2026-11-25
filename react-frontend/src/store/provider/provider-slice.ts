import { createSlice } from "@reduxjs/toolkit";

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
