import AuthContext from "@/common/AuthContext";
import type { Role } from "@/common/roles.enum";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ForbiddenAccess from "./forbiddenAccess";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const token = auth?.authDetails?.token;
  const user = auth?.authDetails?.user;

  const isAuthenticated = Boolean(token && token.length > 0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <ForbiddenAccess />;
}
