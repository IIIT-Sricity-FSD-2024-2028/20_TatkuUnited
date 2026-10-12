import AuthContext from "@/common/AuthContext";
import type { Role } from "@/common/roles.enum";
import type { UserInterface } from "@/models/auth.models";
import { handleLogout } from "@/common/services/authService";
import { useContext } from "react";

export default function useAuth(): {
    user: UserInterface | undefined, 
    token: string | undefined,
    role: Role | undefined,
    isAuthenticated: boolean,
    logout: () => void
} {
    const auth = useContext(AuthContext);
    // { user, token, role, isAuthenticated, logout }
    const user = auth?.authDetails?.user;
    const token = auth?.authDetails?.token;
    const role = user ? user.role : undefined;
    const isAuthenticated = Boolean(token && token.length > 0);
    return {
        user, token, role, isAuthenticated,
        logout: handleLogout
    }
}