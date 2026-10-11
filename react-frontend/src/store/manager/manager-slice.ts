import { createSlice } from "@reduxjs/toolkit";
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

interface ManagerState {
  managerInfo: Manager | null;
  regions: Region[];
  selectedRegionId: string | null;
}

const initialState: ManagerState = {
  managerInfo: null,
  regions: [],
  selectedRegionId: null,
};

// The back-end accepts the auth user id for both of these lookups.
export const fetchManager = createAsyncThunkTyped(
  "manager/fetchManager",
  async (userId: string, thunkAPI): Promise<Manager> => {
    const { token } = thunkAPI.getState().auth;
    try {
      const res = await axios.get<Manager>(
        `${BASE_URL}/managers/user/${userId}`,
        authConfig(token),
      );
      return res.data;
    } catch {
      throw new Error("Fetching manager details failed");
    }
  },
);

export const fetchRegions = createAsyncThunkTyped(
  "manager/fetchRegions",
  async (userId: string, thunkAPI): Promise<Region[]> => {
    const { token } = thunkAPI.getState().auth;
    try {
      const res = await axios.get<Region[]>(
        `${BASE_URL}/regions/manager/${userId}`,
        authConfig(token),
      );
      return res.data;
    } catch {
      throw new Error("Fetching regions failed");
    }
  },
);

const ManagerSlice = createSlice({
  name: "manager",
  initialState,
  reducers: {},
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
      });
  },
});

export const ManagerReducer = ManagerSlice.reducer;
export const ManagerActions = ManagerSlice.actions;
