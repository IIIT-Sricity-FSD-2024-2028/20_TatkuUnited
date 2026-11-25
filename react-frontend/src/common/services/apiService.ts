import axios from "axios";
import { BASE_URL, type ENDPOINT_TYPE } from "../endpoints";
import type { HTTP_METHOD_TYPE } from "@/common/http.methods";
import { readSession } from "./sessionStorage";

let getToken: () => string | null = () => readSession()?.token ?? null;

/** Injected by the store to avoid API -> store -> services import cycles. */
export function setApiTokenSource(source: () => string | null): void {
    getToken = source;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
    if (axios.isAxiosError(error)) {
        const message: unknown = error.response?.data?.message;
        if (Array.isArray(message)) return message.filter((item) => typeof item === "string").join("; ") || fallback;
        if (typeof message === "string") return message;
    }
    return error instanceof Error ? error.message : fallback;
}

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
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
        const response = await apiClient<TResponse>({
            method, url: endpoint, data
        });
        onSuccess?.(response.data);
        return response.data;
    } catch(error) {
        const errorMessage = getApiErrorMessage(error);
        if (error instanceof Error) error.message = errorMessage;
        onError?.(errorMessage);
        return Promise.reject(error);
    }
};
