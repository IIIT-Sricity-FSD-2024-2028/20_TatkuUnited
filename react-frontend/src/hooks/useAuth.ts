import type { Role } from "@/common/roles.enum";
import type { UserInterface } from "@/models/auth.models";
import { handleLogout } from "@/common/services/authService";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function useAuth(): {
    user: UserInterface | undefined, 
    token: string | undefined,
    role: Role | undefined,
    isAuthenticated: boolean,
    logout: () => void
} {
    // const auth = useContext(AuthContext);
    // { user, token, role, isAuthenticated, logout }
    const auth = useSelector((state: RootState) => state.auth);
    const user = auth?.user ?? undefined;
    const token = auth?.token ?? undefined;
    const role = user ? user.role : undefined;
    const isAuthenticated = Boolean(token && token.length > 0);
    return {
        user, token, role, isAuthenticated,
        logout: handleLogout
    }
}