import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from ".";

const createAsyncThunkTyped = createAsyncThunk.withTypes<{
    state: RootState,
    dispatch: AppDispatch,
}>();

export default createAsyncThunkTyped;