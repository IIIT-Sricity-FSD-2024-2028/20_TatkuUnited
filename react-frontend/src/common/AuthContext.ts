import type { AuthInterface } from "@/models/auth.models";
import { createContext } from "react";

export interface AuthContextInterface {
    authDetails: AuthInterface,
    setAuthDetails: React.Dispatch<React.SetStateAction<AuthInterface>>;
}

const AuthContext = createContext<AuthContextInterface | null>(null);
export default AuthContext;