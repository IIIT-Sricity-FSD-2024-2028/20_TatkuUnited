import { createSlice } from "@reduxjs/toolkit";

interface RegionState {

}

const initialState: RegionState = {

}

const RegionSlice = createSlice({
    name: "region",
    initialState,
    reducers: {

    },
})

export const regionReducer = RegionSlice.reducer;
export const regionActions = RegionSlice.actions;