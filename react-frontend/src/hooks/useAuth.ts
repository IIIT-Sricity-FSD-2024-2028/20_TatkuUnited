import type { Role } from "@/common/roles.enum";
import { handleLogout } from "@/common/services/authService";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useMemo } from "react";
import type { AuthInterface, SessionUser } from "@/models/auth.models";

export default function useAuth(): {
    authDetails: AuthInterface | null,
    user: SessionUser | undefined,
    token: string | undefined,
    role: Role | undefined,
    isAuthenticated: boolean,
    logout: () => void
} {
    const auth = useSelector((state: RootState) => state.auth);
    const authDetails = useMemo(() => auth.user && auth.token
        ? { user: auth.user, token: auth.token } : null, [auth]);
    const user = auth?.user ?? undefined;
    const token = auth?.token ?? undefined;
    const role = user ? user.role : undefined;
    const isAuthenticated = Boolean(token && token.length > 0);
    return {
        authDetails, user, token, role, isAuthenticated,
        logout: handleLogout
    }
}
