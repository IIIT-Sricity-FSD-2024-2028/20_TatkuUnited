
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchDashboard } from "@/store/superuser/superuser-slice";
import { useEffect, useMemo } from "react";
import { BsCart2, BsCheckCircle, BsExclamationCircle } from "react-icons/bs";
import SummaryCards, { type SummaryStat } from "@/components/superuser/SummaryCards";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SuperUser_Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, pending, error } = useSelector(
    (state: RootState) => state.superuser,
  );
  const loading = pending > 0 || !dashboard.loaded;

  const SUMMARY_STATS: SummaryStat[] = [
      { title: "Total Services", count: dashboard.totalServices, icon: <BsCart2 size={24} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
      { title: "Total Categories", count: dashboard.totalCategories, icon: <BsCheckCircle size={24} />, iconColor: "text-green-600", bg: "bg-green-50" },
      { title: "Total Regions", count: dashboard.totalRegions, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
      { title: "Total Customers", count: dashboard.totalCustomers, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
      { title: "Total Providers", count: dashboard.totalProviders, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
    ];

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const bookingStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    dashboard.bookings.forEach((booking) => {
      counts[booking.status] = (counts[booking.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dashboard.bookings]);

  if (error) return <div>{error}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6 md:p-6 bg-slate-50 min-h-screen">
        <SummaryCards stats={SUMMARY_STATS} />

        {/* Chart Card Container */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            Bookings by Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingStatusData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 14, dy: 10 }} 
              />
              <YAxis 
                allowDecimals={false} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 14 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill="#4f46e5" 
                name="Bookings" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>

  );
}
