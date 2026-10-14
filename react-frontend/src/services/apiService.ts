import axios from "axios";
import { BASE_URL, type ENDPOINT_TYPE } from "../common/endpoints";
import type { HTTP_METHOD_TYPE } from "@/common/http.methods";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => Promise.reject(error)
);

export const apiService = async (method: HTTP_METHOD_TYPE, endpoint: ENDPOINT_TYPE, data: any, onSuccess?: any, onError?: any) => {
    try {
        const response = await axiosInstance({
            method, url: endpoint, data
        });
        onSuccess?.(response.data);
        return response.data;
    } catch (error) {
        const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || "Something went wrong"
            : error instanceof Error
                ? error.message
                : "Something went wrong";
        onError?.(errorMessage);
        return Promise.reject(error);
    }
};
