import { useEffect, useState } from "react";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import { getProviderByUser } from "@/services/providers.service";
import {
  getBookingsByProvider,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
} from "@/services/bookings.service";
import type {
  ProviderDocument,
  BookingDocument,
  ServiceDocument,
  UserDocument,
} from "@/models/api.models";

function formatSlotTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

export default function AssignedJobs() {
  const authContext = useAuthContext();
  const storedUser = getStoredUser();
  const userId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const [provider, setProvider] = useState<ProviderDocument | null>(null);
  const [bookings, setBookings] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProviderData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Resolve Provider document using User ObjectId
      const providerDoc = await getProviderByUser(userId);
      setProvider(providerDoc);

      if (providerDoc && providerDoc._id) {
        // 2. Fetch bookings using actual Provider ObjectId
        const providerBookings = await getBookingsByProvider(providerDoc._id);
        setBookings(providerBookings || []);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load provider profile or assigned jobs.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, [userId]);

  const handleAction = async (
    bookingId: string,
    action: "accept" | "reject" | "start" | "complete",
  ) => {
    if (!provider?._id) return;
    setActionLoadingId(bookingId);
    setError(null);
    setSuccessMsg(null);
    try {
      if (action === "accept") {
        await acceptBooking(bookingId, provider._id);
        setSuccessMsg("Booking offer accepted!");
      } else if (action === "reject") {
        await rejectBooking(bookingId, provider._id);
        setSuccessMsg("Booking offer declined.");
      } else if (action === "start") {
        await startBooking(bookingId);
        setSuccessMsg("Job marked as In Progress.");
      } else if (action === "complete") {
        await completeBooking(bookingId);
        setSuccessMsg("Job successfully marked as Completed!");
      }

      // Refresh real booking list from backend
      const updated = await getBookingsByProvider(provider._id);
      setBookings(updated || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        `Action ${action} failed. Please try again.`;
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            In Progress
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Confirmed
          </span>
        );
      case "awaiting_provider":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Offer Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            Cancelled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Overview Card */}
      {provider && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Provider Dashboard: {storedUser?.name || "Service Professional"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Provider ID: <span className="font-mono text-xs">{provider._id}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-medium text-slate-400 uppercase block">Rating</span>
                <span className="text-lg font-bold text-amber-500">
                  {typeof provider.rating === "number" ? provider.rating.toFixed(1) : "0.0"} ★
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({provider.ratingCount || 0} reviews)
                  </span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-400 uppercase block">Status</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 capitalize">
                  {provider.status || "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Main Jobs Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Assigned Jobs & Booking Offers</h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time service bookings dispatched from the backend assignment engine.
            </p>
          </div>
          <button
            type="button"
            onClick={loadProviderData}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
            <p className="text-sm">Loading assigned jobs from backend...</p>
          </div>
        ) : !provider ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
            <h3 className="font-semibold text-base">No Provider Profile Found</h3>
            <p className="text-sm mt-1 max-w-md mx-auto">
              This account has the service provider role, but no matching provider document was found in the database. Please request registration from your regional manager.
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center text-slate-500">
            <p className="text-base font-medium text-slate-700">No jobs currently assigned</p>
            <p className="text-sm text-slate-400 mt-1">
              New customer booking offers dispatched to your region will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Time Slot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const serviceName =
                    typeof booking.service === "object" && booking.service !== null
                      ? (booking.service as ServiceDocument).name
                      : "Service";

                  const customerName =
                    typeof booking.customer === "object" && booking.customer !== null
                      ? (booking.customer as UserDocument).name
                      : "Customer";

                  const customerPhone =
                    typeof booking.customer === "object" && booking.customer !== null
                      ? (booking.customer as UserDocument).phone
                      : "";

                  const dateStr = booking.scheduledDate
                    ? new Date(booking.scheduledDate).toLocaleDateString("en-IN")
                    : "-";

                  const timeStr = `${formatSlotTime(booking.startTime)} - ${formatSlotTime(booking.endTime)}`;
                  const isBusy = actionLoadingId === booking._id;

                  return (
                    <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {serviceName}
                        <span className="block text-xs font-mono text-slate-400">
                          #{booking._id.slice(-6)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-800">{customerName}</span>
                        {customerPhone && (
                          <span className="block text-xs text-slate-400">{customerPhone}</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">{dateStr}</td>

                      <td className="px-4 py-4 text-slate-600 font-mono text-xs">{timeStr}</td>

                      <td className="px-4 py-4">{getStatusBadge(booking.status)}</td>

                      <td className="px-4 py-4 text-right">
                        {/* Allowed action buttons based on status transitions */}
                        {booking.status === "awaiting_provider" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleAction(booking._id, "accept")}
                              disabled={isBusy}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 transition cursor-pointer"
                            >
                              {isBusy ? "..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(booking._id, "reject")}
                              disabled={isBusy}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 transition cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : booking.status === "confirmed" ? (
                          <button
                            type="button"
                            onClick={() => handleAction(booking._id, "start")}
                            disabled={isBusy}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300 transition cursor-pointer"
                          >
                            {isBusy ? "Starting..." : "Start Service"}
                          </button>
                        ) : booking.status === "in_progress" ? (
                          <button
                            type="button"
                            onClick={() => handleAction(booking._id, "complete")}
                            disabled={isBusy}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 transition cursor-pointer"
                          >
                            {isBusy ? "Completing..." : "Complete Service"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
