import { createSlice } from "@reduxjs/toolkit";

interface ReviewState {

}

const initialState: ReviewState = {

}

const ReviewSlice = createSlice({
    name: "review",
    initialState,
    reducers: {

    },
})

export const reviewReducer = ReviewSlice.reducer;
export const reviewActions = ReviewSlice.actions;