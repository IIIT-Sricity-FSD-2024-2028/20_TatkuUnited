import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { errorMessage } from "../errorMessage";
import { createReview, getAllReviews } from "@/services/reviews.service";
import { AuthActions } from "../auth/auth-slice";
import type { CreateReviewDto, ReviewDocument } from "@/models/api.models";

interface ReviewState {
  reviews: ReviewDocument[];
  loaded: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  loaded: false,
  submitting: false,
  error: null,
};

export const fetchReviews = createAsyncThunkTyped(
  "review/fetchReviews",
  async (): Promise<ReviewDocument[]> => {
    try {
      return await getAllReviews();
    } catch {
      throw new Error("Unable to load reviews.");
    }
  },
);

/** Submit a review, then reload the public list. */
export const submitReview = createAsyncThunkTyped(
  "review/submitReview",
  async (dto: CreateReviewDto): Promise<ReviewDocument[]> => {
    try {
      await createReview(dto);
    } catch (err) {
      throw new Error(
        errorMessage(
          err,
          "Failed to submit review. Each booking can only be reviewed once.",
        ),
      );
    }
    return getAllReviews().catch(() => [] as ReviewDocument[]);
  },
);

const ReviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
        state.loaded = true;
      })
      .addCase(fetchReviews.rejected, (state) => {
        state.loaded = true;
      })
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.submitting = false;
        // keep the existing list if the reload came back empty
        if (action.payload.length > 0) state.reviews = action.payload;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? "Failed to submit review.";
      });
  },
});

export const reviewReducer = ReviewSlice.reducer;
export const reviewActions = ReviewSlice.actions;
export const ReviewActions = reviewActions;
