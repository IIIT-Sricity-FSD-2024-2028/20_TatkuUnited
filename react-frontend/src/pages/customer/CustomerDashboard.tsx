import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Customer Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Welcome to Tatku United. What would you like to do today?
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate("/")}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800">Browse Services</h2>
          <p className="mt-2 text-sm text-slate-600">
            Explore services available on Tatku United.
          </p>
        </button>

        <button
          onClick={() => navigate("/customer/cart")}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800">My Cart</h2>
          <p className="mt-2 text-sm text-slate-600">
            View your selected services.
          </p>
        </button>

        <button
          onClick={() => navigate("/customer/schedule")}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800">Schedule Service</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose when you want your services provided.
          </p>
        </button>

        <button
          onClick={() => navigate("/customer/account-settings")}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800">Account Settings</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage your personal details and addresses.
          </p>
        </button>

        <button
          onClick={() => navigate("/customer/ratings-feedback")}
          className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-slate-800">Ratings & Feedback</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review completed services and give feedback.
          </p>
        </button>
      </div>
    </div>
  );
}