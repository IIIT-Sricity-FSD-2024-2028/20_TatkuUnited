import { useEffect, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import { useAuthContext } from "@/common/AuthContext";
import {
  getProviderByUser,
  getProviderSchedule,
} from "@/services/providers.service";
import DataTable from "./DataTable";

interface Job {
  bookingId: string;
  serviceName: string;
  customerName: string;
  serviceAddress: string;
  scheduledDate: string;
  startTime: string;
  status: string;
}

interface Booking {
  _id: string;
  service?: { name?: string };
  customer?: { name?: string };
  order?: { address?: { line?: string; city?: string } };
  scheduledDate: string;
  startTime: number;
  status: string;
}

const columns = [
  { key: "serviceName", label: "Service Name" },
  { key: "customerName", label: "Customer Name" },
  { key: "serviceAddress", label: "Address" },
  { key: "scheduledDate", label: "Date" },
  { key: "startTime", label: "Time" },
  { key: "status", label: "Status" },
] as const;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function AssignedJobs() {
  const { authDetails } = useAuthContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authDetails?.user;
    if (!user || user.role !== RolesEnum.PROVIDER) {
      setLoading(false);
      return;
    }

    async function fetchJobs() {
      try {
        setError(null);
        const provider = await getProviderByUser(user.id);
        const bookings = (await getProviderSchedule(provider._id)) as unknown as Booking[];

        setJobs(
          bookings.map((booking) => ({
            bookingId: booking._id,
            serviceName: booking.service?.name ?? "Unknown service",
            customerName: booking.customer?.name ?? "Unknown customer",
            serviceAddress: [
              booking.order?.address?.line,
              booking.order?.address?.city,
            ]
              .filter(Boolean)
              .join(", "),
            scheduledDate: formatDate(booking.scheduledDate),
            startTime: formatTime(booking.startTime),
            status: booking.status,
          })),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load assigned jobs.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchJobs();
  }, [authDetails]);

  if (authDetails?.user.role !== RolesEnum.PROVIDER) {
    return <p className="rounded-lg bg-white p-6 shadow">Provider access required.</p>;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold text-slate-800">Assigned Jobs</h1>
      {loading && <p>Loading assigned jobs...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && jobs.length === 0 && <p>No jobs assigned.</p>}
      {!loading && !error && jobs.length > 0 && (
        <DataTable columns={columns} data={jobs} rowKey="bookingId" />
      )}
    </div>
  );
}


