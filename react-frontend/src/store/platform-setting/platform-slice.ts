import { createSlice } from "@reduxjs/toolkit";

interface PlatformState {

}

const initialState: PlatformState = {

}

const PlatformSlice = createSlice({
    name: "platform",
    initialState,
    reducers: {

    },
})

export const platformReducer = PlatformSlice.reducer;
export const platformActions = PlatformSlice.actions;