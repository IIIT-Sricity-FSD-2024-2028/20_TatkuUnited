import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { getBookingsByRegion } from "@/services/bookings.service";
import type { BookingDocument } from "@/models/api.models";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerDashboard() {
  const manager = useSelector((state: RootState) => state.manager.managerInfo);
  const collective = useSelector((state: RootState) => state.manager.collectiveInfo);
  const serviceProviders = useSelector((state: RootState) => state.manager.providersInfo);
  const regionId = collective?._id || collective?.collective_id;

  const [regionBookings, setRegionBookings] = useState<BookingDocument[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!regionId || regionId === "No Region Assigned") return;

    const currentRegionId = regionId;
    let isMounted = true;
    async function fetchBookings() {
      setLoadingBookings(true);
      try {
        const bookings = await getBookingsByRegion(currentRegionId);
        if (isMounted) {
          setRegionBookings(bookings || []);
        }
      } catch {
        if (isMounted) setRegionBookings([]);
      } finally {
        if (isMounted) setLoadingBookings(false);
      }
    }

    fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [regionId]);

  const completedBookings = regionBookings.filter((b) => b.status === "completed");
  const totalRevenuePaise = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalRevenueRupees = Math.round(totalRevenuePaise / 100);

  return (
    <div className="p-2 space-y-6">
      <div>
        <h1 className="font-semibold text-2xl text-slate-900">
          Welcome back, {manager?.name || "Manager"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Regional performance overview for operational territory.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Assigned Region
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {collective?.collective_name || collective?.name || "No Region Assigned"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {serviceProviders.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Completed Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {loadingBookings ? "..." : completedBookings.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Region Revenue (All time)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">
            {loadingBookings ? "..." : `₹${totalRevenueRupees.toLocaleString("en-IN")}`}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
