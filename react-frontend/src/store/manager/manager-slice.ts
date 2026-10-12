import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import { getProvidersByRegion, getProviderById } from "@/services/providers.service";
import { getBookingsByRegion } from "@/services/bookings.service";
import { getServices } from "@/services/services.service";
import { getCategories } from "@/services/categories.service";
import type {
  BookingDocument,
  CategoryDocument,
  ManagerDocument,
  ProviderDocument,
  RegionDocument,
  ServiceDocument,
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
  rating?: number;
  ratingCount?: number;
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
  services: ServiceDocument[];
  categories: CategoryDocument[];
  pending: number; // in-flight requests
  error: string | null;
}

const initialState: ManagerState = {
  managerInfo: null,
  regions: [],
  selectedRegionId: null,
  providers: [],
  bookings: [],
  services: [],
  categories: [],
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
    let list: RegionProvider[];
    try {
      list = (await getProvidersByRegion(regionId)) as unknown as RegionProvider[];
    } catch {
      throw new Error("Fetching service providers failed");
    }
    // The region list only has the user's id. The single-provider endpoint
    // populates it with name and email, so fetch every provider's details in
    // parallel. If one lookup fails, keep that provider's basic data.
    return Promise.all(
      list.map(async (p) => {
        try {
          return (await getProviderById(p._id)) as unknown as RegionProvider;
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
      return (await getBookingsByRegion(regionId)) as unknown as RegionBooking[];
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
  for (const id of provider.offeredServices) {
    const category = services.find((s) => s._id === id)?.category;
    if (!category) continue;
    const name =
      typeof category === "string"
        ? categories.find((c) => c._id === category)?.name
        : category.name;
    if (name) names.add(name);
  }
  return [...names];
}

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
      .addCase(fetchCatalogue.fulfilled, (state, action) => {
        state.services = action.payload.services;
        state.categories = action.payload.categories;
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
