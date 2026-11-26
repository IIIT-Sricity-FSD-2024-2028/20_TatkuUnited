import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import createAsyncThunkTyped from "../asyncThunk";
import { AuthActions } from "../auth/auth-slice";
import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  getCategories,
  getCategoryById,
  updateCategory as updateCategoryApi,
} from "@/services/categories.service";
import type {
  CategoryDocument,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/models/api.models";

export interface CategoryState {
  items: CategoryDocument[];
  selectedCategory: CategoryDocument | null;
  loading: boolean;
  error: string | null;
  requestId: string | null;
}

const initialState: CategoryState = {
  items: [],
  selectedCategory: null,
  loading: false,
  error: null,
  requestId: null,
};

export const fetchCategories = createAsyncThunkTyped(
  "category/fetchCategories",
  async (): Promise<CategoryDocument[]> => {
    return getCategories();
  },
);

export const fetchCategoryById = createAsyncThunkTyped(
  "category/fetchCategoryById",
  async (id: string): Promise<CategoryDocument> => {
    return getCategoryById(id);
  },
);

export const createCategory = createAsyncThunkTyped(
  "category/createCategory",
  async (dto: CreateCategoryDto): Promise<CategoryDocument> => {
    return createCategoryApi(dto);
  },
);

export const updateCategory = createAsyncThunkTyped(
  "category/updateCategory",
  async ({
    id,
    dto,
  }: {
    id: string;
    dto: UpdateCategoryDto;
  }): Promise<CategoryDocument> => {
    return updateCategoryApi(id, dto);
  },
);

export const deleteCategory = createAsyncThunkTyped(
  "category/deleteCategory",
  async (id: string): Promise<string> => {
    await deleteCategoryApi(id);
    return id;
  },
);

const CategorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    resetSlice: () => initialState,
    selectCategory(state, action: PayloadAction<CategoryDocument | null>) {
      state.selectedCategory = action.payload;
    },
    clearCategoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AuthActions.login, () => initialState)
      .addCase(AuthActions.logout, () => initialState)
      .addCase(fetchCategories.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.requestId = null;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch categories";
        }
      })
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategory = action.payload;
        const index = state.items.findIndex((cat) => cat._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to fetch category";
        }
      })
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to create category";
        }
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((cat) => cat._id === action.payload._id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.selectedCategory?._id === action.payload._id) {
          state.selectedCategory = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to update category";
        }
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((cat) => cat._id !== action.payload);
        if (state.selectedCategory?._id === action.payload) {
          state.selectedCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message ?? "Failed to delete category";
        }
      });
  },
});

export const categoryReducer = CategorySlice.reducer;
export const categoryActions = CategorySlice.actions;
export const CategoryActions = categoryActions;
