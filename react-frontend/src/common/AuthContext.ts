import type { AuthInterface } from "@/models/auth.models";
import { createContext, useContext } from "react";

export interface AuthContextInterface {
    authDetails: AuthInterface | null,
    setAuthDetails: React.Dispatch<React.SetStateAction<AuthInterface | null>>;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export function useAuthContext(): AuthContextInterface {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within AuthContext.Provider");
    }
    return context;
}

export default AuthContext;