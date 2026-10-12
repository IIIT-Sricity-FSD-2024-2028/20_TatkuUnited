import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import { getProvidersByRegion } from "@/services/providers.service";
import { getBookingsByRegion } from "@/services/bookings.service";
import type {
  BookingDocument,
  ManagerDocument,
  ProviderDocument,
  RegionDocument,
} from "@/models/api.models";

// The back-end's status values differ from the ones in api.models, so
// override them here with what the API actually returns.
export type ProviderStatus = "pending" | "approved" | "suspended";
export type BookingStatus =
  | "pending"
  | "awaiting_provider"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RegionProvider = Omit<ProviderDocument, "status"> & {
  status: ProviderStatus;
};
export type RegionBooking = Omit<BookingDocument, "status"> & {
  status: BookingStatus;
};

interface ManagerState {
  managerInfo: ManagerDocument | null;
  regions: RegionDocument[];
  selectedRegionId: string | null;
  providers: RegionProvider[];
  bookings: RegionBooking[];
  pending: number; // in-flight requests
  error: string | null;
}

const initialState: ManagerState = {
  managerInfo: null,
  regions: [],
  selectedRegionId: null,
  providers: [],
  bookings: [],
  pending: 0,
  error: null,
};

export const fetchManager = createAsyncThunkTyped(
  "manager/fetchManager",
  async (userId: string): Promise<ManagerDocument> => {
    let manager: ManagerDocument | null;
    try {
      // the API answers 200 with an empty body when there is no profile
      manager = (await getManagerByUser(userId)) || null;
    } catch {
      throw new Error("Fetching manager details failed");
    }
    if (!manager) throw new Error("No manager profile found for this account");
    return manager;
  },
);

export const fetchRegions = createAsyncThunkTyped(
  "manager/fetchRegions",
  async (managerId: string): Promise<RegionDocument[]> => {
    try {
      return await getRegionsByManager(managerId);
    } catch {
      throw new Error("Fetching regions failed");
    }
  },
);

export const fetchRegionProviders = createAsyncThunkTyped(
  "manager/fetchRegionProviders",
  async (regionId: string): Promise<RegionProvider[]> => {
    try {
      return (await getProvidersByRegion(regionId)) as unknown as RegionProvider[];
    } catch {
      throw new Error("Fetching service providers failed");
    }
  },
);

export const fetchRegionBookings = createAsyncThunkTyped(
  "manager/fetchRegionBookings",
  async (regionId: string): Promise<RegionBooking[]> => {
    try {
      return (await getBookingsByRegion(regionId)) as unknown as RegionBooking[];
    } catch {
      throw new Error("Fetching bookings failed");
    }
  },
);

const ManagerSlice = createSlice({
  name: "manager",
  initialState,
  reducers: {
    selectRegion(state, action: PayloadAction<string>) {
      state.selectedRegionId = action.payload;
      state.providers = [];
      state.bookings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManager.fulfilled, (state, action) => {
        state.managerInfo = action.payload;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.regions = action.payload;
        const stillValid = action.payload.some(
          (r) => r._id === state.selectedRegionId,
        );
        if (!stillValid) state.selectedRegionId = action.payload[0]?._id ?? null;
      })
      .addCase(fetchRegionProviders.fulfilled, (state, action) => {
        state.providers = action.payload;
      })
      .addCase(fetchRegionBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;
      })
      .addMatcher(
        (a) => a.type.startsWith("manager/") && a.type.endsWith("/pending"),
        (state) => {
          state.pending += 1;
          state.error = null;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("manager/") && a.type.endsWith("/fulfilled"),
        (state) => {
          state.pending -= 1;
        },
      )
      .addMatcher(
        (a) => a.type.startsWith("manager/") && a.type.endsWith("/rejected"),
        (state, action) => {
          state.pending -= 1;
          state.error =
            (action as { error?: { message?: string } }).error?.message ??
            "Something went wrong";
        },
      );
  },
});

export const ManagerReducer = ManagerSlice.reducer;
export const ManagerActions = ManagerSlice.actions;
