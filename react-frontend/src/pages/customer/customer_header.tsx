import { Link, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useAuthContext } from "@/common/AuthContext";

export default function CustomerHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setAuthDetails } = useAuthContext();

  const handleUserLogout = () => {
    sessionStorage.clear();
    setAuthDetails(null);
    navigate("/auth/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Customer Portal</h2>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Browse Services
        </Link>

        {user && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium text-slate-900">{user.name}</span>
          </div>
        )}

        <button
          onClick={handleUserLogout}
          className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
