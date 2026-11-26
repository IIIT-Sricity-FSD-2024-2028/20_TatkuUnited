import { createSlice, isPending, isFulfilled, isRejected, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import {
  approveProvider,
  getProvidersByRegion,
  suspendProvider,
} from "@/services/providers.service";
import { updateUser } from "@/services/users.service";
import axios from "axios";
import {
  cancelBooking,
  completeBooking,
  getBookingsByRegion,
} from "@/services/bookings.service";
import { getServices } from "@/services/services.service";
import { getCategories } from "@/services/categories.service";
import { AuthActions } from "../auth/auth-slice";
import type {
  BookingDocument,
  CategoryDocument,
  ManagerDocument,
  ProviderDocument,
  ProviderStatus,
  RegionDocument,
  ServiceDocument,
  UpdateUserDto,
  UserDocument,
} from "@/models/api.models";

export type { ProviderStatus } from "@/schema";
export type RegionProvider = ProviderDocument;
export type RegionBooking = BookingDocument;

interface ManagerState {
  managerInfo: ManagerDocument | null;
  userInfo: UserDocument | null; // the manager's own name, email and phone
  regions: RegionDocument[];
  selectedRegionId: string | null;
  providers: RegionProvider[];
  bookings: RegionBooking[];
  services: ServiceDocument[];
  categories: CategoryDocument[];
  pending: number;
  pendingRequests: Record<string, true>;
  error: string | null;
}

const initialState: ManagerState = {
  managerInfo: null,
  userInfo: null,
  regions: [],
  selectedRegionId: null,
  providers: [],
  bookings: [],
  services: [],
  categories: [],
  pending: 0,
  pendingRequests: {},
  error: null,
};

export const fetchManagerDetails = createAsyncThunkTyped(
  "manager/fetchManagerDetails",
  async (userId: string): Promise<ManagerDocument> => {
    const manager = await getManagerByUser(userId);
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
      return await getProvidersByRegion(regionId);
    } catch {
      throw new Error("Fetching service providers failed");
    }
  },
);

export const fetchRegionBookings = createAsyncThunkTyped(
  "manager/fetchRegionBookings",
  async (regionId: string): Promise<RegionBooking[]> => {
    try {
    return await getBookingsByRegion(regionId);
    } catch {
      throw new Error("Fetching bookings failed");
    }
  },
);

export const fetchCatalogue = createAsyncThunkTyped(
  "manager/fetchCatalogue",
  async (): Promise<{
    services: ServiceDocument[];
    categories: CategoryDocument[];
  }> => {
    try {
      // categories are only used for names, so a failure there isn't fatal
      const [services, categories] = await Promise.all([
        getServices(),
        getCategories().catch(() => [] as CategoryDocument[]),
      ]);
      return { services, categories };
    } catch {
      throw new Error("Fetching services failed");
    }
  },
);

/** Approve or suspend a provider. Not part of managerRequests: it shouldn't trigger page skeletons. */
export const changeProviderStatus = createAsyncThunkTyped(
  "manager/changeProviderStatus",
  async ({
    id,
    action,
  }: {
    id: string;
    action: "approve" | "suspend";
  }): Promise<{ id: string; status: ProviderStatus }> => {
    try {
      const updated =
        action === "approve" ? await approveProvider(id) : await suspendProvider(id);
      return { id, status: updated.status as unknown as ProviderStatus };
    } catch {
      throw new Error(`Could not ${action} provider`);
    }
  },
);

/** Save the manager's own name/email/phone, then mirror it into the auth session. */
export const updateManagerProfile = createAsyncThunkTyped(
  "manager/updateManagerProfile",
  async (
    { userId, changes }: { userId: string; changes: UpdateUserDto },
    { dispatch },
  ): Promise<UserDocument> => {
    try {
      const updated = await updateUser(userId, changes);
      dispatch(
        AuthActions.userUpdated({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        }),
      );
      return updated;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw new Error("EMAIL_TAKEN");
      }
      throw new Error("Could not save your profile");
    }
  },
);

/** POST /bookings/:id/complete — manager marks a booking completed. */
export const completeRegionBooking = createAsyncThunkTyped(
  "manager/completeRegionBooking",
  async (id: string): Promise<RegionBooking> => {
    try {
      return await completeBooking(id);
    } catch {
      throw new Error("Could not complete booking");
    }
  },
);

/** POST /bookings/:id/cancel — manager cancels a booking, with an optional reason. */
export const cancelRegionBooking = createAsyncThunkTyped(
  "manager/cancelRegionBooking",
  async ({
    id,
    reason,
  }: {
    id: string;
    reason?: string;
  }): Promise<RegionBooking> => {
    try {
      return await cancelBooking(id, "manager", reason);
    } catch {
      throw new Error("Could not cancel booking");
    }
  },
);

/** Names of the categories a provider works in, via their offered services. */
export function getProviderCategoryNames(
  provider: RegionProvider,
  services: ServiceDocument[],
  categories: CategoryDocument[],
): string[] {
  const names = new Set<string>();
  for (const service of provider.offeredServices) {
    const category = typeof service === "string"
      ? services.find((item) => item._id === service)?.category
      : service.category;
    if (!category) continue;
    const name =
      typeof category === "string"
        ? categories.find((c) => c._id === category)?.name
        : category.name;
    if (name) names.add(name);
  }
  return [...names];
}

// Merge an updated booking into the list, keeping the populated
// service/customer/provider if the POST response returns them as plain ids.
function replaceBooking(
  state: ManagerState,
  action: PayloadAction<RegionBooking>,
) {
  const i = state.bookings.findIndex((b) => b._id === action.payload._id);
  if (i === -1) return;
  const old = state.bookings[i];
  const next: Record<string, unknown> = { ...old, ...action.payload };
  for (const key of ["service", "customer", "provider"] as const) {
    if (typeof action.payload[key] === "string" && typeof old[key] === "object") {
      next[key] = old[key];
    }
  }
  state.bookings[i] = next as unknown as RegionBooking;
}

const managerRequests = [
  fetchManagerDetails,
  fetchRegions,
  fetchRegionProviders,
  fetchRegionBookings,
  fetchCatalogue,
] as const;

const ManagerSlice = createSlice({
  name: "manager",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    selectRegion(state, action: PayloadAction<string>) {
      state.selectedRegionId = action.payload;
      state.providers = [];
      state.bookings = [];
    },
    // replace the stored user after a successful profile save
    userUpdated(state, action: PayloadAction<UserDocument>) {
      state.userInfo = action.payload;
    },
    // update one provider in place, so the list doesn't reload after approve/suspend
    providerStatusChanged(
      state,
      action: PayloadAction<{ id: string; status: ProviderStatus }>,
    ) {
      const provider = state.providers.find((p) => p._id === action.payload.id);
      if (provider) provider.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchManagerDetails.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.managerInfo = action.payload;
        const user = action.payload.user;
        state.userInfo = typeof user === "object" ? user : null;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.regions = action.payload;
        const stillValid = action.payload.some(
          (r) => r._id === state.selectedRegionId,
        );
        if (!stillValid) state.selectedRegionId = action.payload[0]?._id ?? null;
      })
      .addCase(fetchRegionProviders.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        if (action.meta.arg !== state.selectedRegionId) return;
        state.providers = action.payload;
      })
      .addCase(changeProviderStatus.fulfilled, (state, action) => {
        const provider = state.providers.find((p) => p._id === action.payload.id);
        if (provider) provider.status = action.payload.status;
      })
      .addCase(completeRegionBooking.fulfilled, replaceBooking)
      .addCase(cancelRegionBooking.fulfilled, replaceBooking)
      .addCase(updateManagerProfile.fulfilled, (state, action) => {
        if (state.userInfo) state.userInfo = { ...state.userInfo, ...action.payload };
      })
      .addCase(fetchCatalogue.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.services = action.payload.services;
        state.categories = action.payload.categories;
      })
      .addCase(fetchRegionBookings.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        if (action.meta.arg !== state.selectedRegionId) return;
        state.bookings = action.payload;
      })
      .addMatcher(isPending(...managerRequests), (state, action) => {
        state.pendingRequests[action.meta.requestId] = true;
        state.pending += 1;
        state.error = null;
      })
      .addMatcher(isFulfilled(...managerRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
      })
      .addMatcher(isRejected(...managerRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Something went wrong";
        }
      });
  },
});

export const managerReducer = ManagerSlice.reducer;
export const managerActions = ManagerSlice.actions;
export const ManagerActions = managerActions;
