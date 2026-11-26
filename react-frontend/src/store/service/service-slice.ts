import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  getAvailableSlots as getAvailableSlotsApi,
  getServiceById as getServiceByIdApi,
  getServices as getServicesApi,
  getServicesByCategory as getServicesByCategoryApi,
  type AvailableSlotItem,
  type AvailableSlotsResponse,
} from "@/services/services.service";
import type { ServiceDocument } from "@/models/api.models";

export interface ServiceState {
  items: ServiceDocument[];
  selectedService: ServiceDocument | null;
  slots: AvailableSlotItem[];
  slotsMessage: string;
  loading: boolean;
  slotsLoading: boolean;
  error: string | null;
  requestId: string | null;
}

const initialState: ServiceState = {
  items: [],
  selectedService: null,
  slots: [],
  slotsMessage: "",
  loading: false,
  slotsLoading: false,
  error: null,
  requestId: null,
};

export const fetchServices = createAsyncThunkTyped(
  "service/fetchServices",
  async (includeAll?: boolean): Promise<ServiceDocument[]> => {
    return getServicesApi(includeAll ?? false);
  },
);

export const fetchServicesByCategory = createAsyncThunkTyped(
  "service/fetchServicesByCategory",
  async (categoryId: string): Promise<ServiceDocument[]> => {
    return getServicesByCategoryApi(categoryId);
  },
);

export const fetchServiceById = createAsyncThunkTyped(
  "service/fetchServiceById",
  async (id: string): Promise<ServiceDocument> => {
    return getServiceByIdApi(id);
  },
);

export const fetchAvailableSlots = createAsyncThunkTyped(
  "service/fetchAvailableSlots",
  async ({
    serviceId,
    params,
  }: {
    serviceId: string;
    params: {
      date: string;
      addressId?: string;
      customerId?: string;
      lat?: number;
      lng?: number;
    };
  }): Promise<AvailableSlotsResponse> => {
    return getAvailableSlotsApi(serviceId, params);
  },
);

const ServiceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearServiceError(state) {
      state.error = null;
    },
    selectService(state, action: PayloadAction<ServiceDocument | null>) {
      state.selectedService = action.payload;
    },
    clearSlots(state) {
      state.slots = [];
      state.slotsMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchServices.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch services";
        }
      })
      .addCase(fetchServicesByCategory.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServicesByCategory.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchServicesByCategory.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch services by category";
        }
      })
      .addCase(fetchServiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedService = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch service details";
        }
      })
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
        state.slots = [];
        state.slotsMessage = "";
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slots = action.payload.slots ?? [];
        state.slotsMessage = action.payload.message ?? "";
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.slotsLoading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch available slots";
        }
      });
  },
});

export const serviceReducer = ServiceSlice.reducer;
export const serviceActions = ServiceSlice.actions;
export const ServiceActions = serviceActions;
