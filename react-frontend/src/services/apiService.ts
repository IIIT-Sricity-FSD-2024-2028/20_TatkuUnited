import axios from "axios";
import { BASE_URL, type ENDPOINT_TYPE } from "./endpoints";
import type { HTTP_METHOD_TYPE } from "@/common/http.methods";
import type { UserInterface } from "@/models/auth.models";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => Promise.reject(error)
);

export const apiService = async <TResponse = unknown, TBody = unknown> (
    method: HTTP_METHOD_TYPE, 
    endpoint: ENDPOINT_TYPE, 
    data?: TBody, 
    onSuccess?: any, 
    onError?: any) => {
    try {
        const response = await axiosInstance<TResponse>({
            method, url: endpoint, data
        });
        onSuccess?.(response.data);
        return response.data;
    } catch(error) {
        const errorMessage = error.response?.data?.message || "Something went wrong";
        onError?.(errorMessage);
        return Promise.reject(error);
    }
};