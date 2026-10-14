import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { getBookingsByRegion } from "@/services/bookings.service";
import type { BookingDocument } from "@/models/api.models";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Calendar,
  LucideBadgeIndianRupee,
  PersonStandingIcon,
} from "lucide-react";

export default function ManagerRevenue() {
  const collective = useSelector(
    (state: RootState) => state.manager.collectiveInfo,
  );
  const serviceProviders = useSelector(
    (state: RootState) => state.manager.providersInfo,
  );
  const regionId = collective?._id || collective?.collective_id;

  const [regionBookings, setRegionBookings] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!regionId || regionId === "No Region Assigned") return;

    const currentRegionId = regionId;
    let isMounted = true;
    async function fetchBookings() {
      setLoading(true);
      try {
        const bookings = await getBookingsByRegion(currentRegionId);
        if (isMounted) setRegionBookings(bookings || []);
      } catch {
        if (isMounted) setRegionBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [regionId]);

  const completedBookings = regionBookings.filter((b) => b.status === "completed");
  const totalRevenuePaise = completedBookings.reduce(
    (sum, b) => sum + (b.price || 0),
    0,
  );
  const totalRevenueRupees = Math.round(totalRevenuePaise / 100);

  const activeProvidersCount = serviceProviders.filter(
    (p) => p.status === "active" || p.is_active,
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Revenue Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track territory performance and completed service revenue for {collective?.name || "your region"}.
        </p>
      </header>

      <main className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Total Completed Revenue</CardTitle>
              <CardAction>
                <LucideBadgeIndianRupee className="text-emerald-600" />
              </CardAction>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-emerald-600">
              {loading ? "..." : `₹${totalRevenueRupees.toLocaleString("en-IN")}`}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Completed Bookings</CardTitle>
              <CardAction>
                <Calendar className="text-blue-600" />
              </CardAction>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-slate-900">
              {loading ? "..." : `${completedBookings.length} / ${regionBookings.length}`}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Active Service Providers</CardTitle>
              <CardAction>
                <PersonStandingIcon className="text-indigo-600" />
              </CardAction>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-slate-900">
              {activeProvidersCount}
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">Analytics & Trend Visualizations</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Granular time-series revenue graphs and category splits are unavailable pending backend analytics aggregation pipeline. Summary statistics above reflect active database records.
          </p>
        </div>
      </main>
    </div>
  );
}
