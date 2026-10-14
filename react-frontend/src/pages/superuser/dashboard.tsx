import AuthContext from "@/common/AuthContext";
import { getServices, getCategories, getAllRegions, getAllUsers, getAllProviders, getAllBookings, getAllPayments } from "@/services";
import { useContext, useEffect, useState } from "react";
import type { BookingDocument, PaymentDocument } from "@/models/api.models";

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <p>Services: {totalServices}</p>
      <p>Categories: {totalCategories}</p>
      <p>Regions: {totalRegions}</p>
      <p>Customers: {totalCustomers}</p>
      <p>Providers: {totalProviders}</p>
    </div>
  );
}
