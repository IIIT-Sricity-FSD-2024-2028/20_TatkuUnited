import { createSlice } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { errorMessage } from "../errorMessage";
import {
  getAvailableSlots,
  getServiceById,
  getServices,
  type AvailableSlotItem,
} from "@/services/services.service";
import { AuthActions } from "../auth/auth-slice";
import type { ServiceDocument } from "@/models/api.models";

interface ServiceState {
  services: ServiceDocument[];
  /** the service being scheduled */
  selectedService: ServiceDocument | null;
  loadingService: boolean;
  slots: AvailableSlotItem[];
  /** explanation from the backend when no slot is available, or a load error */
  slotMessage: string;
  loadingSlots: boolean;
  /** latest slots request, so an older response can't overwrite a newer one */
  slotsRequestId: string | null;
  error: string | null;
}

const initialState: ServiceState = {
  services: [],
  selectedService: null,
  loadingService: false,
  slots: [],
  slotMessage: "",
  loadingSlots: false,
  slotsRequestId: null,
  error: null,
};

export const fetchServices = createAsyncThunkTyped(
  "service/fetchServices",
  async (): Promise<ServiceDocument[]> => {
    try {
      return await getServices();
    } catch (err) {
      throw new Error(errorMessage(err, "Services could not be loaded."));
    }
  },
);

/** Load one service by id, or the first service when no id is given. */
export const fetchSelectedService = createAsyncThunkTyped(
  "service/fetchSelectedService",
  async (serviceId: string | null): Promise<ServiceDocument | null> => {
    try {
      if (serviceId) return await getServiceById(serviceId);
      const all = await getServices();
      return all[0] ?? null;
    } catch {
      throw new Error("Service could not be loaded. Please return to catalog.");
    }
  },
);

export const fetchSlots = createAsyncThunkTyped(
  "service/fetchSlots",
  async (args: {
    serviceId: string;
    date: string;
    addressId: string;
    customerId?: string;
    lng?: number;
    lat?: number;
  }): Promise<{ slots: AvailableSlotItem[]; message: string }> => {
    try {
      const { serviceId, ...params } = args;
      const resp = await getAvailableSlots(serviceId, params);
      const slots = resp.slots || [];
      const message = slots.some((s) => s.available)
        ? ""
        : resp.message ||
          "No eligible providers available for this slot or date. Please choose another date.";
      return { slots, message };
    } catch (err) {
      throw new Error(
        errorMessage(err, "Could not check provider availability. Please try again."),
      );
    }
  },
);

const ServiceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    clearSlots(state) {
      state.slots = [];
      state.slotMessage = "";
      state.loadingSlots = false;
      state.slotsRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchServices.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.error = action.error.message ?? "Services could not be loaded.";
      })
      .addCase(fetchSelectedService.pending, (state) => {
        state.loadingService = true;
        state.error = null;
      })
      .addCase(fetchSelectedService.fulfilled, (state, action) => {
        state.loadingService = false;
        state.selectedService = action.payload;
      })
      .addCase(fetchSelectedService.rejected, (state, action) => {
        state.loadingService = false;
        state.error = action.error.message ?? "Service could not be loaded.";
      })
      .addCase(fetchSlots.pending, (state, action) => {
        state.slotsRequestId = action.meta.requestId;
        state.loadingSlots = true;
        state.slots = [];
        state.slotMessage = "";
      })
      .addCase(fetchSlots.fulfilled, (state, action) => {
        if (state.slotsRequestId !== action.meta.requestId) return;
        state.loadingSlots = false;
        state.slots = action.payload.slots;
        state.slotMessage = action.payload.message;
      })
      .addCase(fetchSlots.rejected, (state, action) => {
        if (state.slotsRequestId !== action.meta.requestId) return;
        state.loadingSlots = false;
        state.slots = [];
        state.slotMessage =
          action.error.message ?? "Could not check provider availability. Please try again.";
      });
  },
});

export const serviceReducer = ServiceSlice.reducer;
export const serviceActions = ServiceSlice.actions;
export const ServiceActions = serviceActions;
