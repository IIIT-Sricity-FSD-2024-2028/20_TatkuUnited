import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../services/api";

export interface CollectiveManager {
  cm_id: string;
  name: string;
  email: string;
//   password_hash: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  collective_id: string;
}

export interface Collective {
  collective_id: string;
  collective_name: string;
  is_active: boolean;
  created_at: string;
}

interface ManagerState {
    managerInfo: CollectiveManager | null,
    collectiveInfo: Collective | null,
}

const initialState: ManagerState = {
    managerInfo: null,
    collectiveInfo: null
}

export const fetchManager = createAsyncThunk(
    "manager/fetchManager",
    async (managerId: string):Promise<CollectiveManager> => {
        try {
            const response = await axios.get<CollectiveManager>(`BASE_URL/collective-managers/${managerId}`);
            return response.data;
        } catch(err) {
            throw new Error("Fetching manager details failed");
        }
    }
)

export const fetchCollective = createAsyncThunk(
    "manager/fetchCollective",
    async (managerId: string): Promise<Collective> => {
        try {
            const response = await axios.get<Collective>(`BASE_URL/collective-managers/manager/${managerId}`);
            return response.data;
        } catch(err) {
            throw new Error("Fetching manager details failed");
        }
    }
)

const ManagerSlice = createSlice({
    name: "manager",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchManager.fulfilled, (state, action) => {
            state.managerInfo = action.payload;
        }).addCase(fetchCollective.fulfilled, (state, action) => {
            state.collectiveInfo = action.payload;
        })
    },
})

export const ManagerReducer = ManagerSlice.reducer;
export const ManagerActions = ManagerSlice.actions;