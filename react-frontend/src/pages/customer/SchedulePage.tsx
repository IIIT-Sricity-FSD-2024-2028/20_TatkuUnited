import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

  const serviceName = searchParams.get("service") || "Home Cleaning";
  const location = searchParams.get("location") || "Sri City";
  const price = Number(searchParams.get("price")) || 500;

  // Temporary default. Replace with the backend's actual minLeadMinutes value.
  const minLeadMinutes = 120;

  const today = getLocalDateString(new Date());
  const latestDate = new Date();
  latestDate.setDate(latestDate.getDate() + 2);
  const maxDate = getLocalDateString(latestDate);

  const [mode, setMode] = useState<"instant" | "scheduled">("instant");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const availableTimes = date ? getAvailableTimes(date, minLeadMinutes) : [];

  const handleAddToCart = () => {
    if (mode === "scheduled") {
      if (!date || !time) {
        alert("Please select a date and time.");
        return;
      }

      const selectedDateTime = new Date(`${date}T${time}:00`);
      const minimumStart = new Date(Date.now() + minLeadMinutes * 60 * 1000);

      if (selectedDateTime < minimumStart || !availableTimes.includes(time)) {
        alert("Please select a valid future time slot.");
        setTime("");
        return;
      }
    }

    const newItem = {
      id: Date.now(),
      serviceName,
      location,
      schedule:
        mode === "instant"
          ? "Instant Booking"
          : `Scheduled for ${date} at ${time}`,
      price,
    };

    try {
      const existingCart = JSON.parse(
        localStorage.getItem("cartItems") || "[]",
      );

      if (!Array.isArray(existingCart)) {
        throw new Error("Invalid cart data");
      }

      localStorage.setItem(
        "cartItems",
        JSON.stringify([...existingCart, newItem]),
      );

      navigate("/customer/cart");
    } catch {
      alert("Unable to update your cart. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <main className="pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Schedule Your Service
          </h1>

          <p className="mt-2 text-slate-500">
            Choose when you want your service to be provided.
          </p>
        </header>

        <div className="mb-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-2">
          <button
            type="button"
            className={`flex-1 rounded-lg py-3 font-medium ${
              mode === "instant"
                ? "bg-blue-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setMode("instant")}
          >
            Instant
          </button>

          <button
            type="button"
            className={`flex-1 rounded-lg py-3 font-medium ${
              mode === "scheduled"
                ? "bg-blue-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setMode("scheduled")}
          >
            Scheduled
          </button>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {mode === "instant"
              ? "Your service will be assigned to an available provider immediately."
              : "Choose a date and start time. Final availability must be confirmed by the backend."}
          </div>

          {mode === "scheduled" && (
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
          )}

          <div className="border-t border-slate-200 pt-6">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">
              Service Summary
            </h2>

            <dl className="space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Service</dt>
                <dd className="text-right font-medium text-slate-900">
                  {serviceName}
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
                <dd className="font-bold text-blue-600">₹{price}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-3 font-medium text-white transition hover:bg-blue-600"
          >
            Add to Cart
          </button>
        </section>
      </main>
    </div>
  );
}

export default SchedulePage;
