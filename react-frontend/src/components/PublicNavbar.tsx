import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../store";
import { RolesEnum, type Role } from "../common/roles.enum";
import UrlMap from "../common/urlMap";

interface PublicNavbarProps {
  brandName: string;
  brandInitials: string;
  onNavigate: (path: string) => void;
}

export default function PublicNavbar({
  brandName,
  brandInitials,
  onNavigate,
}: PublicNavbarProps) {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole: Role = user?.role ?? null;
  let redirectUrl = "";

  if (token && token.length > 0 && userRole) {
    switch (userRole) {
      case RolesEnum.CUSTOMER:
        redirectUrl = UrlMap.customer;
        break;
      case RolesEnum.SERVICE_PROVIDER:
        redirectUrl = UrlMap.provider;
        break;
      case RolesEnum.SUPER_USER:
        redirectUrl = UrlMap.super_user;
        break;
      case RolesEnum.COLLECTIVE_MANAGER:
        redirectUrl = UrlMap.manager;
        break;
      case RolesEnum.UNIT_MANAGER:
        redirectUrl = UrlMap.manager;
        break;
    }
  }

  return (
    <nav
      id="navbar"
      className="flex items-center justify-between px-6 py-4 bg-white shadow-sm fixed top-0 left-0 w-full z-50"
    >
      <Link
        to="/"
        className="flex items-center gap-2 text-xl font-bold text-gray-800 no-underline"
      >
        <div className="nav-logo-icon">{brandInitials}</div>
        {brandName}
      </Link>

      {token && token.length > 0 ? (
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => onNavigate(redirectUrl)}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm font-medium border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => onNavigate("/auth/login")}
          >
            Login
          </button>
          <button
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            onClick={() => onNavigate("/auth/register")}
          >
            Register
          </button>
        </div>
      )}
    </nav>
  );
}
