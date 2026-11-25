import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import {
  getAllPlatformSettings,
  updatePlatformSetting,
} from "@/services/platformSettings.service";
import { AuthActions } from "../auth/auth-slice";
import type {
  PlatformSettingDocument,
  UpdatePlatformSettingDto,
} from "@/models/api.models";

interface PlatformState {
  settings: PlatformSettingDocument | null;
  requestId: string | null;
  submitting: boolean;
  error: string | null;
}

const initialState: PlatformState = {
  settings: null,
  requestId: null,
  submitting: false,
  error: null,
};

/** GET /platform-settings returns a singleton list, so keep the first entry. */
export const fetchPlatformSettings = createAsyncThunkTyped(
  "platform/fetchPlatformSettings",
  async (): Promise<PlatformSettingDocument | null> => {
    const settings = await getAllPlatformSettings();
    return settings[0] ?? null;
  },
);

export const updatePlatformSettings = createAsyncThunkTyped(
  "platform/updatePlatformSettings",
  async (args: {
    id: string;
    dto: UpdatePlatformSettingDto;
  }): Promise<PlatformSettingDocument> => {
    return updatePlatformSetting(args.id, args.dto);
  },
);

const PlatformSlice = createSlice({
  name: "platform",
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
      .addCase(fetchPlatformSettings.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(fetchPlatformSettings.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.settings = action.payload;
        state.requestId = null;
      })
      .addCase(fetchPlatformSettings.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error =
            action.error.message ?? "Fetching platform settings failed";
        }
      })
      .addCase(updatePlatformSettings.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        state.submitting = false;
        state.settings = action.payload;
      })
      .addCase(updatePlatformSettings.rejected, (state, action) => {
        state.submitting = false;
        if (!action.meta.aborted) {
          state.error =
            action.error.message ?? "Updating platform settings failed";
        }
      });
  },
});

export const platformReducer = PlatformSlice.reducer;
export const platformActions = PlatformSlice.actions;
