import { useNavigate } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar
        brandName="Tatku United"
        brandInitials="TU"
        onNavigate={navigate}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Customer Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Welcome to Tatku United. What would you like to do today?
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-xl border bg-white p-6 text-left shadow-sm hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">Browse Services</h2>
            <p className="mt-2 text-sm text-slate-600">
              Explore services available on Tatku United.
            </p>
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="rounded-xl border bg-white p-6 text-left shadow-sm hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">My Cart</h2>
            <p className="mt-2 text-sm text-slate-600">
              View your selected services.
            </p>
          </button>

          <button
            onClick={() => navigate("/account-settings")}
            className="rounded-xl border bg-white p-6 text-left shadow-sm hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">Account Settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage your account details.
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}