import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  cancelBooking as cancelBookingApi,
  confirmBookingCompletion as confirmBookingCompletionApi,
  getBookingById as getBookingByIdApi,
  getBookingsByCustomer as getBookingsByCustomerApi,
  rejectBookingCompletion as rejectBookingCompletionApi,
} from "@/services/bookings.service";
import type { BookingDocument } from "@/models/api.models";

export interface BookingState {
  items: BookingDocument[];
  selectedBooking: BookingDocument | null;
  loading: boolean;
  error: string | null;
  requestId: string | null;
  actingId: string | null;
}

const initialState: BookingState = {
  items: [],
  selectedBooking: null,
  loading: false,
  error: null,
  requestId: null,
  actingId: null,
};

function replaceBooking(items: BookingDocument[], updated: BookingDocument) {
  const index = items.findIndex((b) => b._id === updated._id);
  if (index >= 0) {
    items[index] = updated;
  } else {
    items.push(updated);
  }
}

export const fetchCustomerBookings = createAsyncThunkTyped(
  "booking/fetchCustomerBookings",
  async (customerId: string): Promise<BookingDocument[]> => {
    return getBookingsByCustomerApi(customerId);
  },
);

export const fetchBookingById = createAsyncThunkTyped(
  "booking/fetchBookingById",
  async (id: string): Promise<BookingDocument> => {
    return getBookingByIdApi(id);
  },
);

export const confirmCompletion = createAsyncThunkTyped(
  "booking/confirmCompletion",
  async (id: string): Promise<BookingDocument> => {
    return confirmBookingCompletionApi(id);
  },
);

export const rejectCompletion = createAsyncThunkTyped(
  "booking/rejectCompletion",
  async (id: string): Promise<BookingDocument> => {
    return rejectBookingCompletionApi(id);
  },
);

export const cancelBookingThunk = createAsyncThunkTyped(
  "booking/cancelBooking",
  async ({
    id,
    cancelledBy = "customer",
    reason,
  }: {
    id: string;
    cancelledBy?: string;
    reason?: string;
  }): Promise<BookingDocument> => {
    return cancelBookingApi(id, cancelledBy, reason);
  },
);

const BookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearBookingError(state) {
      state.error = null;
    },
    selectBooking(state, action: PayloadAction<BookingDocument | null>) {
      state.selectedBooking = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchCustomerBookings.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchCustomerBookings.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch customer bookings";
        }
      })
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBooking = action.payload;
        replaceBooking(state.items, action.payload);
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch booking";
        }
      })
      .addCase(confirmCompletion.pending, (state, action) => {
        state.actingId = action.meta.arg;
        state.error = null;
      })
      .addCase(confirmCompletion.fulfilled, (state, action) => {
        state.actingId = null;
        replaceBooking(state.items, action.payload);
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      })
      .addCase(confirmCompletion.rejected, (state, action) => {
        state.actingId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to confirm booking completion";
        }
      })
      .addCase(rejectCompletion.pending, (state, action) => {
        state.actingId = action.meta.arg;
        state.error = null;
      })
      .addCase(rejectCompletion.fulfilled, (state, action) => {
        state.actingId = null;
        replaceBooking(state.items, action.payload);
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      })
      .addCase(rejectCompletion.rejected, (state, action) => {
        state.actingId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to reject booking completion";
        }
      })
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        replaceBooking(state.items, action.payload);
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload;
        }
      });
  },
});

export const bookingReducer = BookingSlice.reducer;
export const bookingActions = BookingSlice.actions;
export const BookingActions = bookingActions;
