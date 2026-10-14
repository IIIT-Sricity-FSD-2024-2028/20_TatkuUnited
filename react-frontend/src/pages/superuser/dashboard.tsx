
import AuthContext from "@/common/AuthContext";
import { getServices, getCategories, getAllRegions, getAllUsers, getAllProviders, getAllBookings, getAllPayments } from "@/services";
import { useContext, useEffect, useState } from "react";
import type { BookingDocument, PaymentDocument } from "@/models/api.models";
import { BsCart2, BsCheckCircle, BsExclamationCircle } from "react-icons/bs";
import SummaryCards, { type SummaryStat } from "@/components/superuser/SummaryCards";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SuperUser_Dashboard() {
  const authContext = useContext(AuthContext);
  const token = authContext?.authDetails?.token;

  const [totalServices, setTotalServices] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalRegions, setTotalRegions] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProviders, setTotalProviders] = useState(0);

  const [bookings, setBookings] = useState<BookingDocument[]>([]);
  const [payments, setPayments] = useState<PaymentDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SUMMARY_STATS: SummaryStat[] = [
      { title: "Total Services", count: totalServices, icon: <BsCart2 size={24} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
      { title: "Total Categories", count: totalCategories, icon: <BsCheckCircle size={24} />, iconColor: "text-green-600", bg: "bg-green-50" },
      { title: "Total Regions", count: totalRegions, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
      { title: "Total Customers", count: totalCustomers, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
      { title: "Total Providers", count: totalProviders, icon: <BsExclamationCircle size={24} />, iconColor: "text-orange-500", bg: "bg-orange-50" },
    ];

  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      try {
        setLoading(true);

        const [services, categories, regions, users, providers, allBookings, allPayments] =
          await Promise.all([
            getServices(),
            getCategories(),
            getAllRegions(),
            getAllUsers(),
            getAllProviders(),
            getAllBookings(),
            getAllPayments(),
          ]);

        setTotalServices(services.length);
        setTotalCategories(categories.length);
        setTotalRegions(regions.length);

        setTotalCustomers(users.filter((u) => u.role === "customer").length);
        setTotalProviders(providers.length);

        setBookings(allBookings);
        setPayments(allPayments);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

    const buildBookingStatusData = () => {
      const counts: Record<string, number> = {};
      bookings.forEach((b) => {
        counts[b.status] = (counts[b.status] ?? 0) + 1; // ??0 for inital undefined case
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value })); // disctionary to object lsit ({a:b} to {name :a, value:b})
    };
    const bookingStatusData = buildBookingStatusData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
