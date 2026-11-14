import { createSlice } from "@reduxjs/toolkit";

interface CategoryState {

}

const initialState: CategoryState = {

}

const CategorySlice = createSlice({
    name: "category",
    initialState,
    reducers: {

    },
})

export const categoryReducer = CategorySlice.reducer;
export const categoryActions = CategorySlice.actions;