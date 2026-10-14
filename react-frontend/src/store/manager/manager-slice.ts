import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import { getProvidersByRegion } from "@/services/providers.service";
import type { RootState } from "..";

export interface CollectiveManager {
  cm_id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  salary?: number;
  experience?: number;
  is_active?: boolean;
  collective_id?: string;
}

export interface Collective {
  collective_id?: string;
  _id?: string;
  collective_name?: string;
  name?: string;
  is_active?: boolean;
}

export interface ServiceProvider {
  sp_id?: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  rating_count?: number;
  is_active?: boolean;
  status?: string;
}

interface ManagerState {
  managerInfo: CollectiveManager | null;
  collectiveInfo: Collective | null;
  providersInfo: ServiceProvider[];
  regionId: string | null;
}

const initialState: ManagerState = {
  managerInfo: null,
  collectiveInfo: null,
  providersInfo: [],
  regionId: null,
};

export const fetchManager = createAsyncThunkTyped(
  "manager/fetchManager",
  async (userId: string): Promise<CollectiveManager> => {
    try {
      const manager = await getManagerByUser(userId);
      const userObj = typeof manager.user === "object" && manager.user !== null ? (manager.user as any) : null;
      return {
        _id: manager._id,
        cm_id: manager._id,
        name: userObj?.name || "Regional Manager",
        email: userObj?.email || "",
        phone: userObj?.phone || "",
        salary: manager.salary,
        experience: manager.experience,
      };
    } catch {
      return {
        name: "Regional Manager",
        email: "",
      };
    }
  },
);

export const fetchCollective = createAsyncThunkTyped(
  "manager/fetchCollective",
  async (managerId: string): Promise<Collective> => {
    try {
      const regions = await getRegionsByManager(managerId);
      const region = Array.isArray(regions) && regions.length > 0 ? regions[0] : null;
      if (!region) {
        return { collective_name: "No Region Assigned", name: "No Region Assigned" };
      }
      return {
        collective_id: region._id,
        _id: region._id,
        collective_name: region.name,
        name: region.name,
        is_active: region.isActive,
      };
    } catch {
      return { collective_name: "No Region Assigned", name: "No Region Assigned" };
    }
  },
);

export const fetchServiceProviders = createAsyncThunkTyped(
  "manager/fetchServiceProviders",
  async (targetRegionId: string | undefined, thunkAPI): Promise<ServiceProvider[]> => {
    const globalState: RootState = thunkAPI.getState();
    const regionId =
      targetRegionId ||
      globalState.manager.regionId ||
      globalState.manager.collectiveInfo?._id ||
      globalState.manager.collectiveInfo?.collective_id;

    if (!regionId) return [];

    try {
      const providers = await getProvidersByRegion(regionId);
      return (providers || []).map((p) => {
        const userObj = typeof p.user === "object" && p.user !== null ? (p.user as any) : null;
        return {
          _id: p._id,
          sp_id: p._id,
          name: userObj?.name || "Service Provider",
          email: userObj?.email || "",
          phone: userObj?.phone || "",
          rating: p.rating || 0,
          rating_count: p.ratingCount || 0,
          status: p.status,
          is_active: p.status === "active",
        };
      });
    } catch {
      return [];
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
      .addCase(fetchCollective.fulfilled, (state, action) => {
        state.collectiveInfo = action.payload;
        state.regionId = action.payload._id || action.payload.collective_id || null;
      })
      .addCase(fetchServiceProviders.fulfilled, (state, action) => {
        state.providersInfo = action.payload;
      });
  },
});

export const ManagerReducer = ManagerSlice.reducer;
export const ManagerActions = ManagerSlice.actions;