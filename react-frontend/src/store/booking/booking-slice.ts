import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import {
  confirmBookingCompletion,
  getBookingsByCustomer,
  rejectBookingCompletion,
} from "@/services/bookings.service";
import { AuthActions } from "../auth/auth-slice";
import type { RootState } from "..";
import type { BookingDocument } from "@/models/api.models";

interface BookingState {
  /** the logged-in customer's bookings */
  bookings: BookingDocument[];
  /** true after the first fetch finishes, so pages can tell "loading" from "empty" */
  loaded: boolean;
  /** id of the booking a confirm/reject is running on */
  acting: string | null;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  loaded: false,
  acting: null,
  error: null,
};

export const fetchCustomerBookings = createAsyncThunkTyped(
  "booking/fetchCustomerBookings",
  async (_: void, { getState }): Promise<BookingDocument[]> => {
    const id = (getState() as RootState).auth.user?.id;
    if (!id) return [];
    try {
      return await getBookingsByCustomer(id);
    } catch {
      throw new Error(
        "Unable to refresh bookings. Displayed details may be out of date.",
      );
    }
  },
);

/** Customer confirms (complete = true) or rejects the provider's completion request. */
export const decideCompletion = createAsyncThunkTyped(
  "booking/decideCompletion",
  async ({
    id,
    complete,
  }: {
    id: string;
    complete: boolean;
  }): Promise<BookingDocument> => {
    try {
      return await (complete
        ? confirmBookingCompletion(id)
        : rejectBookingCompletion(id));
    } catch {
      throw new Error(
        "This booking may have changed. Refresh to check its current status before trying again.",
      );
    }
  },
);

const BookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
        state.loaded = true;
        // don't overwrite the list while a confirm/reject is mid-flight
        if (state.acting !== null) return;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchCustomerBookings.rejected, (state, action) => {
        state.loaded = true;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Unable to load bookings.";
        }
      })
      .addCase(decideCompletion.pending, (state, action) => {
        state.acting = action.meta.arg.id;
        state.error = null;
      })
      .addCase(decideCompletion.fulfilled, (state, action) => {
        state.acting = null;
        state.bookings = state.bookings.map((b) =>
          b._id === action.payload._id ? action.payload : b,
        );
      })
      .addCase(decideCompletion.rejected, (state, action) => {
        state.acting = null;
        state.error = action.error.message ?? "Could not update this booking.";
      });
  },
});

export const bookingReducer = BookingSlice.reducer;
export const bookingActions = BookingSlice.actions;
export const BookingActions = bookingActions;
