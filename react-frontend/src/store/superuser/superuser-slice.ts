import { createSlice } from "@reduxjs/toolkit";

interface SuperuserState {

}

const initialState: SuperuserState = {

}

const SuperuserSlice = createSlice({
    name: "superuser",
    initialState,
    reducers: {
        resetSlice: () => initialState,
    },
})

export const superuserReducer = SuperuserSlice.reducer;
export const superuserActions = SuperuserSlice.actions;
