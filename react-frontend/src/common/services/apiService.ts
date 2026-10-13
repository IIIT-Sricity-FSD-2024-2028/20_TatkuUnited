import axios, { type AxiosError } from "axios";
import { BASE_URL, type ENDPOINT_TYPE } from "../endpoints";
import type { HTTP_METHOD_TYPE } from "@/common/http.methods";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
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
    onSuccess?: (data: TResponse) => void, 
    onError?: (errorMessage: string) => void
): Promise<TResponse> => {
    try {
        const response = await axiosInstance<TResponse>({
            method, url: endpoint, data
        });
        onSuccess?.(response.data);
        return response.data;
    } catch(error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "Something went wrong";
        onError?.(errorMessage);
        return Promise.reject(error);
    }
};
