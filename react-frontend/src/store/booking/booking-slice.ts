import { createSlice } from "@reduxjs/toolkit";

interface BookingState {

}

const initialState: BookingState = {

}

const BookingSlice = createSlice({
    name: "booking",
    initialState,
    reducers: {

    },
})

export const bookingReducer = BookingSlice.reducer;
export const bookingActions = BookingSlice.actions;