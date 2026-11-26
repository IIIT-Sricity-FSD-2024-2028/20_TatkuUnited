import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  sidebarExpanded: boolean;
}

const initialState: UiState = {
  sidebarExpanded: true,
};

const UiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setSidebarExpanded(state, action: PayloadAction<boolean>) {
      state.sidebarExpanded = action.payload;
    },
  },
});

export const uiReducer = UiSlice.reducer;
export const uiActions = UiSlice.actions;
export const UiActions = uiActions;
