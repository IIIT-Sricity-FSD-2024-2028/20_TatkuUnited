import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import Footer from "../general/landing/Footer";
import { getServices } from "@/services/services.service";
import { addCartItem } from "@/services/users.service";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import type { ServiceDocument } from "@/models/api.models";

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getAvailableTimes(date: string, minLeadMinutes: number): string[] {
  const slots: string[] = [];

  for (let minutes = 8 * 60; minutes <= 19 * 60 + 30; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const time = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

    if (date === getLocalDateString(new Date())) {
      const slotDate = new Date(`${date}T${time}:00`);
      const minimumStart = new Date(Date.now() + minLeadMinutes * 60 * 1000);

      if (slotDate < minimumStart) {
        continue;
      }
    }

    slots.push(time);
  }

  return slots;
}

function SchedulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authContext = useAuthContext();

  const [selectedService, setSelectedService] = useState<ServiceDocument | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const serviceNameParam = searchParams.get("service") || "Home Cleaning";
  const location = searchParams.get("location") || "Sri City";

  useEffect(() => {
    let isMounted = true;
    async function fetchServices() {
      setLoadingService(true);
      try {
        const services = await getServices();
        if (!isMounted) return;

        const targetId = searchParams.get("serviceId") || searchParams.get("id");
        const targetName = searchParams.get("service");

        let match: ServiceDocument | undefined;
        if (targetId) {
          match = services.find((s) => s._id === targetId);
        }
        if (!match && targetName) {
          match = services.find(
            (s) => s.name.toLowerCase() === targetName.toLowerCase()
          );
        }
        if (!match && services.length > 0) {
          match = services[0];
        }
        if (match) {
          setSelectedService(match);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load services:", err);
        }
      } finally {
        if (isMounted) setLoadingService(false);
      }
    }

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const displayName = selectedService?.name || serviceNameParam;
  const parsedParamPrice = searchParams.get("price") ? Number(searchParams.get("price")) : null;
  const displayPrice = selectedService
    ? selectedService.price / 100
    : parsedParamPrice;

  // Temporary default. Replace with the backend's actual minLeadMinutes value.
  const minLeadMinutes = 120;

  const today = getLocalDateString(new Date());
  const latestDate = new Date();
  latestDate.setDate(latestDate.getDate() + 2);
  const maxDate = getLocalDateString(latestDate);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const availableTimes = date ? getAvailableTimes(date, minLeadMinutes) : [];

  const handleAddToCart = async () => {
    setError("");

    if (!date || !time) {
      setError("Please select a date and time.");
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}:00`);
    const minimumStart = new Date(Date.now() + minLeadMinutes * 60 * 1000);

    if (selectedDateTime < minimumStart || !availableTimes.includes(time)) {
      setError("Please select a valid future time slot.");
      setTime("");
      return;
    }

    if (!selectedService?._id) {
      setError("No valid service selected. Please try again.");
      return;
    }

    const storedUser = getStoredUser();
    const customerId =
      authContext.authDetails?.user?.id ||
      (authContext.authDetails?.user as any)?._id ||
      getStoredUserId() ||
      storedUser?.id ||
      storedUser?._id;

    if (!customerId) {
      navigate("/auth/login");
      return;
    }

    const [hoursStr, minsStr] = time.split(":");
    const startTime = Number(hoursStr) * 60 + Number(minsStr);
    const duration = selectedService.duration || 60;
    const endTime = startTime + duration;
    const scheduledDate = new Date(`${date}T00:00:00.000Z`).toISOString();

    setSubmitting(true);
    try {
      await addCartItem(customerId, {
        service: selectedService._id,
        scheduledDate,
        startTime,
        endTime,
      });

      navigate("/cart");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add service to cart. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar
        brandName="TatkuUnited"
        brandInitials="TU"
        onNavigate={(path) => navigate(path)}
      />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Schedule Your Service
          </h1>

          <p className="mt-2 text-slate-500">
            Choose when you want your service to be provided.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            Choose a date and start time. Final availability must be confirmed by the backend.
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="service-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Date
              </label>

              <input
                id="service-date"
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                }}
                className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="service-time"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Start time
              </label>

              <select
                id="service-time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                disabled={!date || availableTimes.length === 0}
                className="w-full rounded-lg border-2 border-slate-200 bg-white p-3 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
              >
                <option value="">
                  {!date
                    ? "Choose a date first"
                    : availableTimes.length === 0
                      ? "No times available"
                      : "Choose a time"}
                </option>

                {availableTimes.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">
              Service Summary
            </h2>

            <dl className="space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Service</dt>
                <dd className="text-right font-medium text-slate-900">
                  {displayName}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-right font-medium text-slate-900">
                  {location}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Estimated Price</dt>
                <dd className="font-bold text-blue-600">
                  {typeof displayPrice === "number" && !isNaN(displayPrice)
                    ? `₹${displayPrice}`
                    : "Unavailable"}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={submitting || loadingService}
            className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-medium text-white transition hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Adding to Cart...
              </>
            ) : (
              "Add to Cart"
            )}
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default SchedulePage;
