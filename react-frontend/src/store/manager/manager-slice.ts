import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../services/api";
import createAsyncThunkTyped from "../asyncThunk";

const authConfig = (token: string | null) => ({
  headers: { Authorization: `Bearer ${token}` },
});

type GeoPoint = { type: "Point"; coordinates: [number, number] };

export interface Manager {
  _id: string;
  user: string;
  salary: number; // paise
  experience: number; // years
  location: GeoPoint;
  status: "active" | "suspended" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  _id: string;
  name: string;
  manager: string;
  location: GeoPoint;
  isActive: boolean;
}

export type ProviderStatus = "pending" | "approved" | "suspended";

export interface RegionProvider {
  _id: string;
  user: string;
  offeredServices: string[];
  experience: number;
  status: ProviderStatus;
  rating: number;
  ratingCount: number;
  region: string | null;
}

export type BookingStatus =
  | "pending"
  | "awaiting_provider"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

// Region bookings come back with service / provider / customer populated.
export interface RegionBooking {
  _id: string;
  service: { _id: string; name?: string } | string;
  provider: { _id: string } | string;
  customer: { _id: string; name?: string } | string;
  scheduledDate: string;
  startTime: number;
  endTime: number;
  status: BookingStatus;
  cancelledBy: string | null;
  price: number; // paise
  platformShare: number; // paise
  providerShare: number; // paise
}

interface ManagerState {
  managerInfo: Manager | null;
  regions: Region[];
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
  async (userId: string, thunkAPI): Promise<Manager> => {
    const { token } = thunkAPI.getState().auth;
    let manager: Manager | null;
    try {
      const res = await axios.get<Manager | "">(
        `${BASE_URL}/managers/user/${userId}`,
        authConfig(token),
      );
      manager = res.data || null; // empty body when there is no profile
    } catch {
      throw new Error("Fetching manager details failed");
    }
    if (!manager) throw new Error("No manager profile found for this account");
    return manager;
  },
);

export const fetchRegions = createAsyncThunkTyped(
  "manager/fetchRegions",
  async (managerId: string, thunkAPI): Promise<Region[]> => {
    const { token } = thunkAPI.getState().auth;
    try {
      const res = await axios.get<Region[]>(
        `${BASE_URL}/regions/manager/${managerId}`,
        authConfig(token),
      );
      return res.data;
    } catch {
      throw new Error("Fetching regions failed");
    }
  },
);

export const fetchRegionProviders = createAsyncThunkTyped(
  "manager/fetchRegionProviders",
  async (regionId: string, thunkAPI): Promise<RegionProvider[]> => {
    const { token } = thunkAPI.getState().auth;
    try {
      const res = await axios.get<RegionProvider[]>(
        `${BASE_URL}/providers/region/${regionId}`,
        authConfig(token),
      );
      return res.data;
    } catch {
      throw new Error("Fetching service providers failed");
    }
  },
);

export const fetchRegionBookings = createAsyncThunkTyped(
  "manager/fetchRegionBookings",
  async (regionId: string, thunkAPI): Promise<RegionBooking[]> => {
    const { token } = thunkAPI.getState().auth;
    try {
      const res = await axios.get<RegionBooking[]>(
        `${BASE_URL}/bookings/region/${regionId}`,
        authConfig(token),
      );
      return res.data;
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
