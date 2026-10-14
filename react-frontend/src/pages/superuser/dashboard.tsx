import { useEffect, useState } from "react";
import { getAllBookings } from "@/services/bookings.service";
import type { BookingDocument } from "@/models/api.models";

export default function SuperUser_Dashboard() {
  const [bookings, setBookings] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setLoading(true);
      try {
        const data = await getAllBookings();
        if (isMounted) setBookings(data || []);
      } catch {
        if (isMounted) setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  const completed = bookings.filter((b) => b.status === "completed");
  const totalGmvPaise = completed.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalGmvRupees = Math.round(totalGmvPaise / 100);

  const providerSharePaise = completed.reduce(
    (sum, b) => sum + (b.providerShare || 0),
    0,
  );
  const providerShareRupees = Math.round(providerSharePaise / 100);

  const platformSharePaise = completed.reduce(
    (sum, b) => sum + (b.platformShare || 0),
    0,
  );
  const platformShareRupees = Math.round(platformSharePaise / 100);

  const revenueBreakdown = [
    {
      label: "Service Providers Share",
      amount: `₹${providerShareRupees.toLocaleString("en-IN")}`,
    },
    {
      label: "Platform Revenue Share",
      amount: `₹${platformShareRupees.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Platform Revenue Analysis
        </h1>
        <p className="text-slate-500 text-sm">
          Comprehensive breakdown of collective platform revenue based on settled bookings.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Platform Revenue Breakdown
            </h2>
            <p className="text-slate-500 text-sm">
              Fee distributions based on live database records.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {completed.length} completed bookings
          </span>
        </div>

        <div className="p-6">
          <div className="inline-block border border-slate-200 rounded-lg p-4 mb-8 min-w-[200px] bg-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total GMV (Gross Merchandise Value)
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : `₹${totalGmvRupees.toLocaleString("en-IN")}`}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {revenueBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm font-semibold text-slate-700"
              >
                <span>{item.label}</span>
                <span className="text-slate-900 font-bold">{loading ? "..." : item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div >
    </div >
  );
}
