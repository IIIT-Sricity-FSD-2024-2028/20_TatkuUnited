import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import Footer from "../general/landing/Footer";
import { useAuthContext } from "@/common/AuthContext";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { getBookingsByCustomer } from "@/services/bookings.service";
import type { BookingDocument } from "@/models/api.models";

function formatSlotTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function formatBookingDate(dateVal?: string | Date): string {
  if (!dateVal) return "Date not specified";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

function formatPriceDisplay(priceInPaise?: number): string {
  if (typeof priceInPaise !== "number" || isNaN(priceInPaise)) {
    return "Unavailable";
  }
  // All monetary values in backend schema are in paise (1 INR = 100 paise)
  const rupees = priceInPaise / 100;
  return `₹${rupees}`;
}

function getStatusBadge(status?: string) {
  const normalized = (status || "").toLowerCase().replace(/_/g, " ");

  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Completed
        </span>
      );
    case "confirmed":
    case "accepted":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          Confirmed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
          In Progress
        </span>
      );
    case "pending":
    case "awaiting_provider":
    case "offered":
    case "pending_offer":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Pending
        </span>
      );
    case "cancelled":
    case "rejected":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10 capitalize">
          {normalized || "Unknown"}
        </span>
      );
  }
}

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const [bookings, setBookings] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = getStoredUser();
  const customerId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const fetchBookings = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getBookingsByCustomer(customerId);
      const list = Array.isArray(data)
        ? data
        : (data as any)?.bookings && Array.isArray((data as any).bookings)
          ? (data as any).bookings
          : [];

      // Sort newest first
      list.sort((a: BookingDocument, b: BookingDocument) => {
        const timeB = new Date(b.createdAt || b.scheduledDate).getTime();
        const timeA = new Date(a.createdAt || a.scheduledDate).getTime();
        return timeB - timeA;
      });

      setBookings(list);
    } catch (err: any) {
      console.error("Failed to load booking history:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load your bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [customerId]);

  const extractServiceName = (booking: BookingDocument): string | undefined => {
    if (
      typeof booking.service === "object" &&
      booking.service !== null &&
      "name" in booking.service &&
      typeof (booking.service as any).name === "string" &&
      (booking.service as any).name.trim()
    ) {
      return (booking.service as any).name.trim();
    }
    if (
      typeof (booking as any).service_name === "string" &&
      (booking as any).service_name.trim()
    ) {
      return (booking as any).service_name.trim();
    }
    return undefined;
  };

  const extractLocation = (booking: BookingDocument): string | undefined => {
    // 1. Direct location on booking
    if (
      typeof (booking as any).location === "string" &&
      (booking as any).location.trim()
    ) {
      return (booking as any).location.trim();
    }

    // 2. Address from populated order
    if (
      typeof booking.order === "object" &&
      booking.order !== null &&
      (booking.order as any).address
    ) {
      const addr = (booking.order as any).address;
      if (typeof addr.city === "string" && addr.city.trim()) {
        return addr.city.trim();
      }
      if (typeof addr.line === "string" && addr.line.trim()) {
        return addr.line.trim();
      }
    }

    // 3. Populated region name
    if (
      typeof booking.region === "object" &&
      booking.region !== null &&
      typeof (booking.region as any).name === "string" &&
      (booking.region as any).name.trim()
    ) {
      return (booking.region as any).name.trim();
    }

    // 4. Customer's saved address city
    const savedAddresses = (storedUser as any)?.addresses;
    if (Array.isArray(savedAddresses) && savedAddresses.length > 0) {
      const city = savedAddresses.find(
        (a: any) => typeof a.city === "string" && a.city.trim(),
      )?.city;
      if (city) return city.trim();
    }

    return undefined;
  };

  const handleRebook = (booking: BookingDocument) => {
    const serviceName = extractServiceName(booking);
    const location = extractLocation(booking);

    const priceInPaise =
      typeof booking.price === "number" && !isNaN(booking.price)
        ? booking.price
        : typeof booking.service === "object" &&
            booking.service !== null &&
            typeof (booking.service as any).price === "number" &&
            !isNaN((booking.service as any).price)
          ? (booking.service as any).price
          : undefined;

    if (!serviceName) {
      alert(
        "Service name is unavailable for this booking record. Please browse available services to book.",
      );
      return;
    }

    if (!location) {
      alert(
        "Location details are unavailable for this booking record. Please select your service from the catalog.",
      );
      return;
    }

    if (priceInPaise === undefined) {
      alert(
        "Pricing information is unavailable for this booking record. Please select the service from the catalog to rebook.",
      );
      return;
    }

    // In backend schema, price is in paise (1 INR = 100 paise). SchedulePage expects price in rupees.
    const priceInRupees = priceInPaise / 100;

    navigate(
      `/schedule?service=${encodeURIComponent(serviceName)}&price=${encodeURIComponent(priceInRupees)}&location=${encodeURIComponent(location)}`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <PublicNavbar
          brandName="TatkuUnited"
          brandInitials="TU"
          onNavigate={(path) => navigate(path)}
        />

        <main className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Booking History
              </h1>
              <p className="mt-2 text-slate-500">
                View your past and upcoming service bookings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 cursor-pointer"
            >
              Browse Services
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchBookings}
                className="font-medium underline hover:no-underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content States */}
          {!customerId ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-500">
                🔒
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Please Sign In
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You must be logged in as a customer to view your booking history.
              </p>
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="mt-6 inline-flex rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div
              role="status"
              className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm"
            >
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="font-medium text-slate-700">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📅
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                No bookings found
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You haven't made any service bookings yet. Once you book a service, you'll see it here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-6 inline-flex rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 cursor-pointer"
              >
                Explore Services
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const serviceName =
                  extractServiceName(booking) || "Service Booking";

                const providerName =
                  typeof booking.provider === "object" &&
                  booking.provider !== null
                    ? (booking.provider as any).name ||
                      (booking.provider as any).businessName ||
                      undefined
                    : undefined;

                const displayPrice = formatPriceDisplay(booking.price);

                return (
                  <div
                    key={booking._id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold text-slate-900">
                            {serviceName}
                          </h2>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span aria-hidden="true">📅</span>
                            <span>{formatBookingDate(booking.scheduledDate)}</span>
                          </span>

                          {typeof booking.startTime === "number" && (
                            <span className="flex items-center gap-1.5">
                              <span aria-hidden="true">🕒</span>
                              <span>{formatSlotTime(booking.startTime)}</span>
                            </span>
                          )}

                          {providerName && (
                            <span className="flex items-center gap-1.5">
                              <span aria-hidden="true">👤</span>
                              <span>Provider: {providerName}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <div className="text-right">
                          <span className="block text-xs text-slate-500">
                            Price
                          </span>
                          <span
                            className={
                              displayPrice === "Unavailable"
                                ? "text-sm font-medium text-slate-400"
                                : "text-xl font-bold text-blue-600"
                            }
                          >
                            {displayPrice}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRebook(booking)}
                          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 cursor-pointer"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
