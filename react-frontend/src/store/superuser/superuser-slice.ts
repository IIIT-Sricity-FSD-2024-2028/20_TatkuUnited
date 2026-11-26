import { createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";
import axios from "axios";
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
import {
  createRegion as createRegionApi,
  deleteRegion as deleteRegionApi,
  getAllRegions,
  updateRegion as updateRegionApi,
} from "@/services/regions.service";
import {
  createUser as createUserApi,
  deleteUser as deleteUserApi,
  getAllUsers,
  getMe,
  updateUser as updateUserApi,
} from "@/services/users.service";
import { createManager, getAllManagers, updateManager } from "@/services/managers.service";
import { getAllProviders } from "@/services/providers.service";
import { getAllBookings } from "@/services/bookings.service";
import { AuthActions } from "../auth/auth-slice";
import type {
  BookingDocument,
  CategoryDocument,
  CreateCategoryDto,
  CreateRegionDto,
  CreateServiceDto,
  CreateUserDto,
  GeoLocationDto,
  ManagerDocument,
  RegionDocument,
  ServiceDocument,
  UpdateCategoryDto,
  UpdateRegionDto,
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
  userInfo: UserDocument | null;
  dashboard: DashboardData;
  users: UserDocument[];
  categories: CategoryDocument[];
  services: ServiceDocument[];
  regions: RegionDocument[];
  managers: ManagerDocument[];
  pending: number;
  pendingRequests: Record<string, true>;
  submitting: boolean;
  error: string | null;
}

const initialState: SuperuserState = {
  userInfo: null,
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
  regions: [],
  managers: [],
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

export const fetchSuperuserProfile = createAsyncThunkTyped(
  "superuser/fetchSuperuserProfile",
  async (): Promise<UserDocument> => {
    return await getMe();
  },
);

/** Save the super user's own name/email/phone, then mirror it into the auth session. */
export const updateSuperuserProfile = createAsyncThunkTyped(
  "superuser/updateSuperuserProfile",
  async (
    { userId, changes }: { userId: string; changes: UpdateUserDto },
    { dispatch },
  ): Promise<UserDocument> => {
    try {
      const updated = await updateUserApi(userId, changes);
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

export const fetchRegions = createAsyncThunkTyped(
  "superuser/fetchRegions",
  (): Promise<RegionDocument[]> => getAllRegions(),
);

export const fetchManagers = createAsyncThunkTyped(
  "superuser/fetchManagers",
  (): Promise<ManagerDocument[]> => getAllManagers(),
);

export interface CreateRegionArgs {
  dto: CreateRegionDto;
  salary: number;
}

export const createRegion = createAsyncThunkTyped(
  "superuser/createRegion",
  async (
    args: CreateRegionArgs,
  ): Promise<{ region: RegionDocument; manager: ManagerDocument }> => {
    const manager = await updateManager(args.dto.manager, {
      salary: args.salary,
    });
    const region = await createRegionApi(args.dto);
    return { region, manager };
  },
);

export interface UpdateRegionArgs {
  id: string;
  dto: UpdateRegionDto;
  managerId: string;
  salary: number;
}

export const updateRegion = createAsyncThunkTyped(
  "superuser/updateRegion",
  async (
    args: UpdateRegionArgs,
  ): Promise<{ region: RegionDocument; manager: ManagerDocument }> => {
    const region = await updateRegionApi(args.id, args.dto);
    const manager = await updateManager(args.managerId, {
      salary: args.salary,
    });
    return { region, manager };
  },
);

export const deleteRegion = createAsyncThunkTyped(
  "superuser/deleteRegion",
  async (id: string): Promise<string> => {
    await deleteRegionApi(id);
    return id;
  },
);

const fetchRequests = [
  fetchSuperuserProfile,
  fetchDashboard,
  fetchUsers,
  fetchCategories,
  fetchServices,
  fetchRegions,
  fetchManagers,
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
  createRegion,
  updateRegion,
  deleteRegion,
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
      .addCase(fetchSuperuserProfile.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.userInfo = action.payload;
      })
      .addCase(updateSuperuserProfile.fulfilled, (state, action) => {
        state.userInfo = state.userInfo
          ? { ...state.userInfo, ...action.payload }
          : action.payload;
        const index = state.users.findIndex(
          (user) => user._id === action.payload._id,
        );
        if (index !== -1) state.users[index] = action.payload;
      })
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
        if (state.userInfo?._id === action.payload._id) {
          state.userInfo = { ...state.userInfo, ...action.payload };
        }
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
      .addCase(fetchRegions.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.regions = action.payload;
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        if (!state.pendingRequests[action.meta.requestId]) return;
        state.managers = action.payload;
      })
      .addCase(createRegion.fulfilled, (state, action) => {
        state.regions.push(action.payload.region);
        const manager = state.managers.find(
          (item) => item._id === action.payload.manager._id,
        );
        if (manager) manager.salary = action.payload.manager.salary;
      })
      .addCase(updateRegion.fulfilled, (state, action) => {
        const index = state.regions.findIndex(
          (region) => region._id === action.payload.region._id,
        );
        if (index !== -1) state.regions[index] = action.payload.region;
        const manager = state.managers.find(
          (item) => item._id === action.payload.manager._id,
        );
        if (manager) manager.salary = action.payload.manager.salary;
      })
      .addCase(deleteRegion.fulfilled, (state, action) => {
        state.regions = state.regions.filter(
          (region) => region._id !== action.payload,
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
