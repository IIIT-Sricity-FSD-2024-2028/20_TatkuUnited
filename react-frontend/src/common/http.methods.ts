export const HTTP_METHODS_ENUM = {
    get: "GET",
    post: "POST",
    put: "PUT",
    delete: "DELETE"
} as const;

export type HTTP_METHOD_TYPE = (typeof HTTP_METHODS_ENUM)[keyof typeof HTTP_METHODS_ENUM];