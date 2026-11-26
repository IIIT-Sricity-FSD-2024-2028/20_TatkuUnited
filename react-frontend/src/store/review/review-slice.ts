import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  createReview as createReviewApi,
  deleteReview as deleteReviewApi,
  getAllReviews as getAllReviewsApi,
  getReviewByBooking as getReviewByBookingApi,
  getReviewById as getReviewByIdApi,
  getReviewsByProvider as getReviewsByProviderApi,
  getReviewsByService as getReviewsByServiceApi,
  updateReview as updateReviewApi,
} from "@/services/reviews.service";
import type {
  CreateReviewDto,
  ReviewDocument,
  UpdateReviewDto,
} from "@/models/api.models";

export interface ReviewState {
  items: ReviewDocument[];
  selectedReview: ReviewDocument | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  requestId: string | null;
}

const initialState: ReviewState = {
  items: [],
  selectedReview: null,
  loading: false,
  submitting: false,
  error: null,
  requestId: null,
};

export const fetchAllReviews = createAsyncThunkTyped(
  "review/fetchAllReviews",
  async (): Promise<ReviewDocument[]> => {
    return getAllReviewsApi();
  },
);

export const fetchReviewsByService = createAsyncThunkTyped(
  "review/fetchReviewsByService",
  async (serviceId: string): Promise<ReviewDocument[]> => {
    return getReviewsByServiceApi(serviceId);
  },
);

export const fetchReviewsByProvider = createAsyncThunkTyped(
  "review/fetchReviewsByProvider",
  async (providerId: string): Promise<ReviewDocument[]> => {
    return getReviewsByProviderApi(providerId);
  },
);

export const fetchReviewByBooking = createAsyncThunkTyped(
  "review/fetchReviewByBooking",
  async (bookingId: string): Promise<ReviewDocument> => {
    return getReviewByBookingApi(bookingId);
  },
);

export const fetchReviewById = createAsyncThunkTyped(
  "review/fetchReviewById",
  async (id: string): Promise<ReviewDocument> => {
    return getReviewByIdApi(id);
  },
);

export const submitReview = createAsyncThunkTyped(
  "review/submitReview",
  async (dto: CreateReviewDto): Promise<ReviewDocument> => {
    return createReviewApi(dto);
  },
);

export const updateReviewThunk = createAsyncThunkTyped(
  "review/updateReview",
  async ({
    id,
    dto,
  }: {
    id: string;
    dto: UpdateReviewDto;
  }): Promise<ReviewDocument> => {
    return updateReviewApi(id, dto);
  },
);

export const deleteReviewThunk = createAsyncThunkTyped(
  "review/deleteReview",
  async (id: string): Promise<string> => {
    await deleteReviewApi(id);
    return id;
  },
);

const ReviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearReviewError(state) {
      state.error = null;
    },
    selectReview(state, action: PayloadAction<ReviewDocument | null>) {
      state.selectedReview = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchAllReviews.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch reviews";
        }
      })
      .addCase(fetchReviewsByService.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchReviewsByProvider.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchReviewById.fulfilled, (state, action) => {
        state.selectedReview = action.payload;
      })
      .addCase(fetchReviewByBooking.fulfilled, (state, action) => {
        state.selectedReview = action.payload;
      })
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.items.unshift(action.payload);
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to submit review";
        }
      })
      .addCase(updateReviewThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.selectedReview?._id === action.payload._id) {
          state.selectedReview = action.payload;
        }
      })
      .addCase(deleteReviewThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r._id !== action.payload);
        if (state.selectedReview?._id === action.payload) {
          state.selectedReview = null;
        }
      });
  },
});

export const reviewReducer = ReviewSlice.reducer;
export const reviewActions = ReviewSlice.actions;
export const ReviewActions = reviewActions;
