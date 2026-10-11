import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "../../services/api";
import type { RootState } from "..";
import createAsyncThunkTyped from "../asyncThunk";

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

export interface ServiceProvider {
  sp_id: string;
  name: string;
  email: string;
//   password_hash: string;
  phone: string;
  dob: string;
  address: string;
  gender: string;
  rating: number;
  rating_count: number;
  is_active: boolean;
  account_status: string;
//   deactivation_requested: boolean;
//   hour_start: string;
//   hour_end: string;
//   created_at: string;
//   updated_at: string;
  unit_id: string;
  home_sector_id: string;
}


interface ManagerState {
    managerInfo: CollectiveManager | null,
    collectiveInfo: Collective | null,
    providersInfo: ServiceProvider[],
}

const initialState: ManagerState = {
    managerInfo: null,
    collectiveInfo: null,
    providersInfo: [],
}

export const fetchManager = createAsyncThunkTyped(
    "manager/fetchManager",
    async (managerId: string, thunkAPI):Promise<CollectiveManager> => {
        const globalState: RootState = thunkAPI.getState();
        const token = globalState.auth.token;

        try {
            const response = await axios.get<CollectiveManager>(`${BASE_URL}/collective-managers/${managerId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-role": "collective_manager"
                    }
                }
            );
            return response.data;
        } catch(err) {
            throw new Error("Fetching manager details failed");
        }
    }
)

export const fetchCollective = createAsyncThunkTyped(
    "manager/fetchCollective",
    async (managerId: string, thunkAPI): Promise<Collective> => {
        const globalState: RootState = thunkAPI.getState();
        const token = globalState.auth.token;

        try {
            const response = await axios.get<Collective>(`${BASE_URL}/collectives/manager/${managerId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-role": "collective_manager"
                    }
                }
            );
            return response.data;
        } catch(err) {
            throw new Error("Fetching manager details failed");
        }
    }
)

export const fetchServiceProviders = createAsyncThunkTyped(
    "manager/fetchServiceProviders",
    async (_, thunkAPI): Promise<ServiceProvider[]> => {
        const globalState: RootState = thunkAPI.getState();
        const token = globalState.auth.token;
        const collective_id = globalState.manager.collectiveInfo?.collective_id;

        try {
            if (!collective_id) {
                throw new Error("Manager collective information is not available");
            }
            const response = await axios.get<ServiceProvider[]>(`${BASE_URL}/service-providers/collective/${collective_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-role": "collective_manager"
                    }
                }
            );
            console.log(response.data);
            return response.data;
        } catch(err) {
            throw new Error("Fetching service providers details failed");
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
        }).addCase(fetchServiceProviders.fulfilled, (state, action) => {
            state.providersInfo = action.payload;
        })
    },
})

export const ManagerReducer = ManagerSlice.reducer;
export const ManagerActions = ManagerSlice.actions;