import { createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import {
  createService as createServiceApi,
  deleteService as deleteServiceApi,
  getServices,
  updateService as updateServiceApi,
} from "@/services/services.service";
import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  getCategories,
  updateCategory as updateCategoryApi,
} from "@/services/categories.service";
import { getAllRegions } from "@/services/regions.service";
import {
  createUser as createUserApi,
  deleteUser as deleteUserApi,
  getAllUsers,
  updateUser as updateUserApi,
} from "@/services/users.service";
import { createManager } from "@/services/managers.service";
import { getAllProviders } from "@/services/providers.service";
import { getAllBookings } from "@/services/bookings.service";
import { AuthActions } from "../auth/auth-slice";
import type {
  BookingDocument,
  CategoryDocument,
  CreateCategoryDto,
  CreateServiceDto,
  CreateUserDto,
  GeoLocationDto,
  ServiceDocument,
  UpdateCategoryDto,
  UpdateServiceDto,
  UpdateUserDto,
  UserDocument,
} from "@/models/api.models";

interface DashboardData {
  totalServices: number;
  totalCategories: number;
  totalRegions: number;
  totalCustomers: number;
  totalProviders: number;
  bookings: BookingDocument[];
  loaded: boolean;
}

interface SuperuserState {
  dashboard: DashboardData;
  users: UserDocument[];
  categories: CategoryDocument[];
  services: ServiceDocument[];
  pending: number;
  pendingRequests: Record<string, true>;
  submitting: boolean;
  error: string | null;
}

const initialState: SuperuserState = {
  dashboard: {
    totalServices: 0,
    totalCategories: 0,
    totalRegions: 0,
    totalCustomers: 0,
    totalProviders: 0,
    bookings: [],
    loaded: false,
  },
  users: [],
  categories: [],
  services: [],
  pending: 0,
  pendingRequests: {},
  submitting: false,
  error: null,
};

/** Counts and booking status data shown on the Super User dashboard. */
export const fetchDashboard = createAsyncThunkTyped(
  "superuser/fetchDashboard",
  async (): Promise<Omit<DashboardData, "loaded">> => {
    const [services, categories, regions, users, providers, bookings] =
      await Promise.all([
        getServices(),
        getCategories(),
        getAllRegions(),
        getAllUsers(),
        getAllProviders(),
        getAllBookings(),
      ]);

    return {
      totalServices: services.length,
      totalCategories: categories.length,
      totalRegions: regions.length,
      totalCustomers: users.filter((user) => user.role === "customer").length,
      totalProviders: providers.length,
      bookings,
    };
  },
);

export interface CreateSuperuserUserArgs {
  user: CreateUserDto;
  /** Required when the new user is a manager; creates the manager profile. */
  managerLocation?: GeoLocationDto;
}

export const fetchUsers = createAsyncThunkTyped(
  "superuser/fetchUsers",
  (): Promise<UserDocument[]> => getAllUsers(),
);

export const createUser = createAsyncThunkTyped(
  "superuser/createUser",
  async (args: CreateSuperuserUserArgs): Promise<UserDocument> => {
    const created = await createUserApi(args.user);
    if (args.user.role === "manager") {
      if (!args.managerLocation) {
        throw new Error("Manager location is required");
      }
      await createManager({
        user: created._id,
        salary: 0,
        experience: 0,
        location: args.managerLocation,
      });
    }
    return created;
  },
);

export const updateUser = createAsyncThunkTyped(
  "superuser/updateUser",
  (args: { id: string; dto: UpdateUserDto }): Promise<UserDocument> =>
    updateUserApi(args.id, args.dto),
);

export const deleteUser = createAsyncThunkTyped(
  "superuser/deleteUser",
  async (id: string): Promise<string> => {
    await deleteUserApi(id);
    return id;
  },
);

export const fetchCategories = createAsyncThunkTyped(
  "superuser/fetchCategories",
  (): Promise<CategoryDocument[]> => getCategories(),
);

export const createCategory = createAsyncThunkTyped(
  "superuser/createCategory",
  (dto: CreateCategoryDto): Promise<CategoryDocument> => createCategoryApi(dto),
);

export const updateCategory = createAsyncThunkTyped(
  "superuser/updateCategory",
  (args: { id: string; dto: UpdateCategoryDto }): Promise<CategoryDocument> =>
    updateCategoryApi(args.id, args.dto),
);

export const deleteCategory = createAsyncThunkTyped(
  "superuser/deleteCategory",
  async (id: string): Promise<string> => {
    await deleteCategoryApi(id);
    return id;
  },
);

export const fetchServices = createAsyncThunkTyped(
  "superuser/fetchServices",
  (): Promise<ServiceDocument[]> => getServices(true),
);

export const createService = createAsyncThunkTyped(
  "superuser/createService",
  (dto: CreateServiceDto): Promise<ServiceDocument> => createServiceApi(dto),
);

export const updateService = createAsyncThunkTyped(
  "superuser/updateService",
  (args: { id: string; dto: UpdateServiceDto }): Promise<ServiceDocument> =>
    updateServiceApi(args.id, args.dto),
);

export const deleteService = createAsyncThunkTyped(
  "superuser/deleteService",
  async (id: string): Promise<string> => {
    await deleteServiceApi(id);
    return id;
  },
);

const fetchRequests = [
  fetchDashboard,
  fetchUsers,
  fetchCategories,
  fetchServices,
] as const;

const mutationRequests = [
  createUser,
  updateUser,
  deleteUser,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  deleteService,
] as const;

const SuperuserSlice = createSlice({
  name: "superuser",
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
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.dashboard = { ...action.payload, loaded: true };
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.users = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (user) => user._id === action.payload._id,
        );
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.categories = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(
          (category) => category._id === action.payload._id,
        );
        if (index !== -1) state.categories[index] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (category) => category._id !== action.payload,
        );
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.services = action.payload;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.services.push(action.payload);
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.services.findIndex(
          (service) => service._id === action.payload._id,
        );
        if (index !== -1) state.services[index] = action.payload;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter(
          (service) => service._id !== action.payload,
        );
      })
      .addMatcher(isPending(...fetchRequests), (state, action) => {
        state.pendingRequests[action.meta.requestId] = true;
        state.pending += 1;
        state.error = null;
      })
      .addMatcher(isFulfilled(...fetchRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
      })
      .addMatcher(isRejected(...fetchRequests), (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        delete state.pendingRequests[action.meta.requestId];
        state.pending -= 1;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Something went wrong";
        }
      })
      .addMatcher(isPending(...mutationRequests), (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addMatcher(isFulfilled(...mutationRequests), (state) => {
        state.submitting = false;
      })
      .addMatcher(isRejected(...mutationRequests), (state, action) => {
        state.submitting = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Something went wrong";
        }
      });
  },
});

export const superuserReducer = SuperuserSlice.reducer;
export const superuserActions = SuperuserSlice.actions;
