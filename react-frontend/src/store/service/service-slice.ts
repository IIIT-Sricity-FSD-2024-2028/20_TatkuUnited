import { createSlice } from "@reduxjs/toolkit";

interface ServiceState {

}

const initialState: ServiceState = {

}

const ServiceSlice = createSlice({
    name: "service",
    initialState,
    reducers: {

    },
})

export const serviceReducer = ServiceSlice.reducer;
export const serviceActions = ServiceSlice.actions;