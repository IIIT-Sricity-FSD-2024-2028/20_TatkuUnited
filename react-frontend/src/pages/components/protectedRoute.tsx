import type { Role } from "@/common/roles.enum";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ForbiddenAccess from "./forbiddenAccess";
import useAuth from "@/hooks/useAuth";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

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
