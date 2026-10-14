// To use this shared sidebar-
// create a layout for the role (if it doesnt exist yet)
// create the route for the pages. example usage- superuser_route

import { NavLink, useNavigate } from "react-router-dom";
import { type ReactNode, createContext, useContext, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import useAuth from "@/hooks/useAuth";
import AuthContext from "@/common/AuthContext";
import { LogOut } from "lucide-react";

const SidebarContext = createContext({ isExpanded: true });

interface SideBarItemProps {
  to: string;
  label: string;
  icon: ReactNode;
}

export default function SideBar({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { logout } = useAuth();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  function handleUserLogout() {
    logout();
    authContext?.setAuthDetails(null);
    navigate("/auth/login");
  }

  return (
    <SidebarContext.Provider value={{ isExpanded }}>
      <aside
        className={`h-full bg-white flex flex-col transition-all duration-300 ${isExpanded ? "w-64" : "w-20"}`}
      >
        <div className="h-16 flex items-center px-6 gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold tracking-wider">
            TU
          </div>

          <span
            className={`font-bold whitespace-nowrap text-gray-900 text-lg tracking-tight transition-all duration-300 ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}
          >
            Tatku United
          </span>
        </div>
        <div className="px-4 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <BsChevronLeft size={20} />
            ) : (
              <BsChevronRight size={20} />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleUserLogout}
            title={!isExpanded ? "Logout" : undefined}
            className="w-full flex items-center gap-4 p-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium cursor-pointer"
          >
            <div className="text-xl shrink-0 flex items-center justify-center">
              <LogOut size={20} />
            </div>

            <span
              className={`whitespace-nowrap transition-all duration-300 ${
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}

export const SidebarItem = ({ to, label, icon }: SideBarItemProps) => {
  const { isExpanded } = useContext(SidebarContext);

  return (
    <NavLink
      to={to}
      title={!isExpanded ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-4 p-3 rounded-lg transition-colors font-medium ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      <div className="text-xl shrink-0 flex items-center justify-center">
        {icon}
      </div>

      <span
        className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"}`}
      >
        {label}
      </span>
    </NavLink>
  );
};
