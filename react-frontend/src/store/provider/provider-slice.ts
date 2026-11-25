import {
  createSlice,
  isPending,
  isFulfilled,
  isRejected,
  type PayloadAction,
} from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  acceptBooking,
  getBookingsByProvider,
  getMyPendingOffers,
  getProviderSchedule,
  rejectBooking,
  requestBookingCompletion,
  startBooking,
} from "@/services/bookings.service";
import {
  getProviderByUser,
  updateProvider,
} from "@/services/providers.service";
import {
  createUnavailability,
  deleteUnavailability,
  getUnavailabilityByProvider,
  updateUnavailability,
} from "@/services/unavailability.service";
import { getUserById, updateUser } from "@/services/users.service";
import type {
  BookingDocument,
  CreateUnavailabilityDto,
  ProviderDocument,
  UnavailabilityDocument,
  UpdateProviderDto,
  UpdateUnavailabilityDto,
  UpdateUserDto,
  UserDocument,
} from "@/models/api.models";

interface ProviderState {
  profile: ProviderDocument | null;
  userProfile: UserDocument | null;
  bookings: BookingDocument[];
  offers: BookingDocument[];
  schedule: BookingDocument[];
  unavailability: UnavailabilityDocument[];
  pending: number;
  pendingRequests: Record<string, true>;
  error: string | null;
}

const initialState: ProviderState = {
  profile: null,
  userProfile: null,
  bookings: [],
  offers: [],
  schedule: [],
  unavailability: [],
  pending: 0,
  pendingRequests: {},
  error: null,
};

export const fetchProviderByUser = createAsyncThunkTyped(
  "provider/fetchProviderByUser",
  async (userId: string): Promise<ProviderDocument> => {
    const provider = await getProviderByUser(userId);
    if (!provider) throw new Error("No provider profile found for this account");
    return provider;
  },
);

export const fetchProviderUser = createAsyncThunkTyped(
  "provider/fetchProviderUser",
  async (userId: string): Promise<UserDocument> => {
    return getUserById(userId);
  },
);

export const fetchProviderBookings = createAsyncThunkTyped(
  "provider/fetchProviderBookings",
  async (providerId: string): Promise<BookingDocument[]> => {
    return getBookingsByProvider(providerId);
  },
);

export const fetchProviderOffers = createAsyncThunkTyped(
  "provider/fetchProviderOffers",
  async (): Promise<BookingDocument[]> => {
    return getMyPendingOffers();
  },
);

export const fetchProviderSchedule = createAsyncThunkTyped(
  "provider/fetchProviderSchedule",
  async (providerId: string): Promise<BookingDocument[]> => {
    return getProviderSchedule(providerId);
  },
);

export const fetchUnavailability = createAsyncThunkTyped(
  "provider/fetchUnavailability",
  async (providerId: string): Promise<UnavailabilityDocument[]> => {
    return getUnavailabilityByProvider(providerId);
  },
);

export const createUnavailabilityThunk = createAsyncThunkTyped(
  "provider/createUnavailability",
  async (dto: CreateUnavailabilityDto): Promise<UnavailabilityDocument> => {
    return createUnavailability(dto);
  },
);

export const updateUnavailabilityThunk = createAsyncThunkTyped(
  "provider/updateUnavailability",
  async ({
    id,
    changes,
  }: {
    id: string;
    changes: UpdateUnavailabilityDto;
  }): Promise<UnavailabilityDocument> => {
    return updateUnavailability(id, changes);
  },
);

export const deleteUnavailabilityThunk = createAsyncThunkTyped(
  "provider/deleteUnavailability",
  async (id: string): Promise<string> => {
    await deleteUnavailability(id);
    return id;
  },
);

export const updateProviderThunk = createAsyncThunkTyped(
  "provider/updateProvider",
  async ({
    id,
    changes,
  }: {
    id: string;
    changes: UpdateProviderDto;
  }): Promise<ProviderDocument> => {
    return updateProvider(id, changes);
  },
);

export const updateProviderUserThunk = createAsyncThunkTyped(
  "provider/updateProviderUser",
  async (
    { id, changes }: { id: string; changes: UpdateUserDto },
    { dispatch },
  ): Promise<UserDocument> => {
    const updated = await updateUser(id, changes);
    dispatch(
      AuthActions.userUpdated({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      }),
    );
    return updated;
  },
);

export const acceptBookingThunk = createAsyncThunkTyped(
  "provider/acceptBooking",
  async ({
    id,
    providerId,
  }: {
    id: string;
    providerId?: string;
  }): Promise<BookingDocument> => {
    return acceptBooking(id, providerId);
  },
);

export const rejectBookingThunk = createAsyncThunkTyped(
  "provider/rejectBooking",
  async ({
    id,
    providerId,
  }: {
    id: string;
    providerId?: string;
  }): Promise<BookingDocument> => {
    return rejectBooking(id, providerId);
  },
);

export const startBookingThunk = createAsyncThunkTyped(
  "provider/startBooking",
  async (id: string): Promise<BookingDocument> => {
    return startBooking(id);
  },
);

export const requestCompletionThunk = createAsyncThunkTyped(
  "provider/requestCompletion",
  async (id: string): Promise<BookingDocument> => {
    return requestBookingCompletion(id);
  },
);

const providerRequests = [
  fetchProviderByUser,
  fetchProviderUser,
  fetchProviderBookings,
  fetchProviderOffers,
  fetchProviderSchedule,
  fetchUnavailability,
  createUnavailabilityThunk,
  updateUnavailabilityThunk,
  deleteUnavailabilityThunk,
  updateProviderThunk,
  updateProviderUserThunk,
  acceptBookingThunk,
  rejectBookingThunk,
  startBookingThunk,
  requestCompletionThunk,
] as const;

function replaceBookingInList(list: BookingDocument[], updated: BookingDocument) {
  const index = list.findIndex((item) => item._id === updated._id);
  if (index >= 0) {
    list[index] = updated;
  }
}

const ProviderSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    offerRemoved(state, action: PayloadAction<string>) {
      state.offers = state.offers.filter((offer) => offer._id !== action.payload);
    },
    bookingStatusUpdated(state, action: PayloadAction<BookingDocument>) {
      replaceBookingInList(state.bookings, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchProviderByUser.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.profile = action.payload;
      })
      .addCase(fetchProviderUser.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.userProfile = action.payload;
      })
      .addCase(fetchProviderBookings.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.bookings = action.payload;
      })
      .addCase(fetchProviderOffers.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.offers = action.payload;
      })
      .addCase(fetchProviderSchedule.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.schedule = action.payload;
      })
      .addCase(fetchUnavailability.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.unavailability = action.payload;
      })
      .addCase(createUnavailabilityThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.unavailability.push(action.payload);
      })
      .addCase(updateUnavailabilityThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        const index = state.unavailability.findIndex(
          (item) => item._id === action.payload._id,
        );
        if (index >= 0) {
          state.unavailability[index] = action.payload;
        }
      })
      .addCase(deleteUnavailabilityThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.unavailability = state.unavailability.filter(
          (item) => item._id !== action.payload,
        );
      })
      .addCase(updateProviderThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.profile = action.payload;
      })
      .addCase(updateProviderUserThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.userProfile = action.payload;
      })
      .addCase(acceptBookingThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.offers = state.offers.filter(
          (offer) => offer._id !== action.payload._id,
        );
        const index = state.bookings.findIndex(
          (booking) => booking._id === action.payload._id,
        );
        if (index >= 0) {
          state.bookings[index] = action.payload;
        } else {
          state.bookings.push(action.payload);
        }
      })
      .addCase(rejectBookingThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.offers = state.offers.filter(
          (offer) => offer._id !== action.meta.arg.id,
        );
      })
      .addCase(startBookingThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        replaceBookingInList(state.bookings, action.payload);
      })
      .addCase(requestCompletionThunk.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        replaceBookingInList(state.bookings, action.payload);
      })
      .addMatcher(isPending(...providerRequests), (state, action) => {
        state.pendingRequests[action.meta.requestId] = true;
        state.pending += 1;
        state.error = null;
      })
      .addMatcher(isFulfilled(...providerRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
      })
      .addMatcher(isRejected(...providerRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Something went wrong";
        }
      });
  },
});

export const providerReducer = ProviderSlice.reducer;
export const providerActions = ProviderSlice.actions;
export const ProviderActions = providerActions;
