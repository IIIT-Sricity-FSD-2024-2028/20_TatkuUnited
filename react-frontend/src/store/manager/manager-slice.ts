import { createSlice, isPending, isFulfilled, isRejected, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import { getProvidersByRegion, getProviderById } from "@/services/providers.service";
import { getBookingsByRegion } from "@/services/bookings.service";
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
    let list: RegionProvider[];
    try {
      list = await getProvidersByRegion(regionId);
    } catch {
      throw new Error("Fetching service providers failed");
    }
    // The region list only has the user's id. The single-provider endpoint
    // populates it with name and email, so fetch every provider's details in
    // parallel. If one lookup fails, keep that provider's basic data.
    return Promise.all(
      list.map(async (p) => {
        try {
          return await getProviderById(p._id);
        } catch {
          return p;
        }
      }),
    );
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
