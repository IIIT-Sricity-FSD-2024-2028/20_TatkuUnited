import { useEffect, useRef, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import { useAuthContext } from "@/common/AuthContext";
import { getProviderByUser } from "@/services/providers.service";
import {
  getBookingsByProvider,
  requestBookingCompletion,
  startBooking,
} from "@/services/bookings.service";
import { Button } from "@/components/ui/button";
import DataTable, { type Column } from "./DataTable";

interface Job {
  bookingId: string;
  serviceName: string;
  customerName: string;
  serviceAddress: string;
  scheduledDate: string;
  startTime: string;
  status: string;
  canStartJob: boolean;
  canRequestCompletion: boolean;
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

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

export default function AssignedJobs() {
  const { authDetails } = useAuthContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [acting, setActing] = useState(false);
  const busy = useRef(false);

  const requestCompletion = async (bookingId: string) => {
    if (busy.current) return;
    busy.current = true;
    setActing(true);
    try {
      setError(null);
      await requestBookingCompletion(bookingId);
      setJobs((current) =>
        current.map((job) =>
          job.bookingId === bookingId
            ? {
                ...job,
                status: "completion_requested",
                canRequestCompletion: false,
              }
            : job,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request completion confirmation.",
      );
    } finally {
      busy.current = false;
      setActing(false);
    }
  };
  const startJob = async (bookingId: string) => {
    if (busy.current) return;
    busy.current = true;
    setActing(true);
    try {
      setError(null);
      await startBooking(bookingId);
      setJobs((current) =>
        current.map((job) =>
          job.bookingId === bookingId
            ? {
                ...job,
                status: "in_progress",
                canStartJob: false,
                canRequestCompletion: true,
              }
            : job,
        ),
      );
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start this job.",
      );
    } finally {
      busy.current = false;
      setActing(false);
    }
  };
  const columns: Column<Job>[] = [
    { key: "serviceName", label: "Service Name" },
    { key: "customerName", label: "Customer Name" },
    { key: "serviceAddress", label: "Address" },
    { key: "scheduledDate", label: "Date" },
    { key: "startTime", label: "Time" },
    { key: "status", label: "Status" },
    {
      key: "canRequestCompletion",
      label: "Action",
      render: (_, row) =>
        row.canStartJob ? (
          <Button
            disabled={acting}
            size="sm"
            onClick={() => void startJob(row.bookingId)}
            type="button"
          >
            Start job
          </Button>
        ) : row.canRequestCompletion ? (
          <Button
            disabled={acting}
            size="sm"
            onClick={() => void requestCompletion(row.bookingId)}
            type="button"
          >
            Request completion
          </Button>
        ) : (
          <span className="text-xs text-slate-500">
            {row.status === "completion_requested"
              ? "Awaiting customer"
              : row.status === "disputed"
                ? "Disputed · awaiting review"
                : "—"}
          </span>
        ),
    },
  ];

  useEffect(() => {
    const user = authDetails?.user;
    if (!user || user.role !== RolesEnum.PROVIDER) {
      setLoading(false);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function fetchJobs() {
      if (!user) return;
      try {
        setError(null);
        const provider = await getProviderByUser(user.id);
        const bookings = (await getBookingsByProvider(
          provider._id,
        )) as unknown as Booking[];

        if (!active || busy.current) return;
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
            canStartJob: booking.status === "confirmed",
            canRequestCompletion: booking.status === "in_progress",
          })),
        );
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load assigned jobs.",
        );
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(fetchJobs, 6000);
        }
      }
    }

    void fetchJobs();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [authDetails?.user.id, authDetails?.user.role]);

  if (authDetails?.user.role !== RolesEnum.PROVIDER) {
    return (
      <p className="rounded-xl border bg-card p-6">Provider access required.</p>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
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
