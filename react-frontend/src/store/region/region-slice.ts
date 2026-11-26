import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  createRegion as createRegionApi,
  deleteRegion as deleteRegionApi,
  getAllRegions,
  getRegionById,
  getRegionsByManager,
  recomputeRegionCentroid as recomputeRegionCentroidApi,
  updateRegion as updateRegionApi,
} from "@/services/regions.service";
import type {
  CreateRegionDto,
  RegionDocument,
  UpdateRegionDto,
} from "@/models/api.models";

export interface RegionState {
  items: RegionDocument[];
  selectedRegion: RegionDocument | null;
  loading: boolean;
  error: string | null;
  requestId: string | null;
}

const initialState: RegionState = {
  items: [],
  selectedRegion: null,
  loading: false,
  error: null,
  requestId: null,
};

export const fetchRegions = createAsyncThunkTyped(
  "region/fetchRegions",
  async (): Promise<RegionDocument[]> => {
    return getAllRegions();
  },
);

export const fetchRegionById = createAsyncThunkTyped(
  "region/fetchRegionById",
  async (id: string): Promise<RegionDocument> => {
    return getRegionById(id);
  },
);

export const fetchRegionsByManager = createAsyncThunkTyped(
  "region/fetchRegionsByManager",
  async (managerId: string): Promise<RegionDocument[]> => {
    return getRegionsByManager(managerId);
  },
);

export const createRegion = createAsyncThunkTyped(
  "region/createRegion",
  async (dto: CreateRegionDto): Promise<RegionDocument> => {
    return createRegionApi(dto);
  },
);

export const updateRegion = createAsyncThunkTyped(
  "region/updateRegion",
  async ({
    id,
    dto,
  }: {
    id: string;
    dto: UpdateRegionDto;
  }): Promise<RegionDocument> => {
    return updateRegionApi(id, dto);
  },
);

export const deleteRegion = createAsyncThunkTyped(
  "region/deleteRegion",
  async (id: string): Promise<string> => {
    await deleteRegionApi(id);
    return id;
  },
);

export const recomputeRegionCentroid = createAsyncThunkTyped(
  "region/recomputeRegionCentroid",
  async (id: string): Promise<RegionDocument> => {
    return recomputeRegionCentroidApi(id);
  },
);

const RegionSlice = createSlice({
  name: "region",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    selectRegion(state, action: PayloadAction<RegionDocument | null>) {
      state.selectedRegion = action.payload;
    },
    clearRegionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchRegions.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchRegions.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch regions";
        }
      })
      .addCase(fetchRegionsByManager.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegionsByManager.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchRegionsByManager.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch manager regions";
        }
      })
      .addCase(fetchRegionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRegion = action.payload;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchRegionById.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch region";
        }
      })
      .addCase(createRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createRegion.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to create region";
        }
      })
      .addCase(updateRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRegion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.selectedRegion?._id === action.payload._id) {
          state.selectedRegion = action.payload;
        }
      })
      .addCase(updateRegion.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to update region";
        }
      })
      .addCase(deleteRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((r) => r._id !== action.payload);
        if (state.selectedRegion?._id === action.payload) {
          state.selectedRegion = null;
        }
      })
      .addCase(deleteRegion.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to delete region";
        }
      })
      .addCase(recomputeRegionCentroid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recomputeRegionCentroid.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((r) => r._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.selectedRegion?._id === action.payload._id) {
          state.selectedRegion = action.payload;
        }
      })
      .addCase(recomputeRegionCentroid.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to recompute region centroid";
        }
      });
  },
});

export const regionReducer = RegionSlice.reducer;
export const regionActions = RegionSlice.actions;
export const RegionActions = regionActions;
