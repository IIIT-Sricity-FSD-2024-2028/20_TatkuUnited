import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { BookingDocument } from "@/models/api.models";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchProviderBookings,
  fetchProviderByUser,
  requestCompletionThunk,
  startBookingThunk,
} from "@/store/provider/provider-slice";
import DataTable, { type Column } from "./DataTable";
import { formatProviderTime, getErrorMessage } from "./provider-utils";

type JobRow = {
  bookingId: string;
  serviceName: string;
  customerName: string;
  serviceAddress: string;
  scheduledDate: string;
  startTime: string;
  status: BookingDocument["status"];
  canStart: boolean;
};

const START_GRACE_MS = 60 * 60 * 1000; // 1 hour before slot time

function toJobRow(booking: BookingDocument, nowMs: number): JobRow {
  const order = typeof booking.order === "object" && booking.order !== null ? booking.order : undefined;
  const scheduledStartMs =
    new Date(booking.scheduledDate).getTime() + (booking.startTime - 330) * 60_000;
  const canStart = Number.isFinite(scheduledStartMs)
    ? nowMs >= scheduledStartMs - START_GRACE_MS
    : true;
  return {
    bookingId: booking._id,
    serviceName: typeof booking.service === "object" && booking.service !== null ? booking.service.name : "Unknown service",
    customerName: typeof booking.customer === "object" && booking.customer !== null ? booking.customer.name : "Unknown customer",
    serviceAddress: [order?.address?.line, order?.address?.city].filter(Boolean).join(", "),
    scheduledDate: new Date(booking.scheduledDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    startTime: `${formatProviderTime(booking.startTime, true)} - ${formatProviderTime(booking.endTime, true)}`,
    status: booking.status,
    canStart,
  };
}

export default function AssignedJobs() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { profile, bookings, pending, error } = useSelector((s: RootState) => s.provider);
  const providerId = profile?._id;

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isProvider && user?.id && !profile) {
      void dispatch(fetchProviderByUser(user.id));
    }
  }, [dispatch, isProvider, profile, user?.id]);

  useEffect(() => {
    if (!providerId) return;
    void dispatch(fetchProviderBookings(providerId));
    const interval = setInterval(() => {
      void dispatch(fetchProviderBookings(providerId));
    }, 6000);
    return () => clearInterval(interval);
  }, [dispatch, providerId]);

  const isLoading = pending > 0 && bookings.length === 0;
  const isError = Boolean(error) && bookings.length === 0;
  const jobs = bookings.map((b) => toJobRow(b, nowMs));
  const runAction = async (action: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    setIsMutating(true);
    try { await action(); } catch (err) { setActionError(getErrorMessage(err, fallback)); } finally { setIsMutating(false); }
  };
  const columns: Column<JobRow>[] = [
    { key: "serviceName", label: "Service Name" }, { key: "customerName", label: "Customer Name" }, { key: "serviceAddress", label: "Address" }, { key: "scheduledDate", label: "Date" }, { key: "startTime", label: "Time" }, { key: "status", label: "Status" },
    { key: "bookingId", label: "Action", render: (_value, row) => row.status === "confirmed" ? <div className="flex flex-col items-start gap-1"><Button disabled={isMutating || !row.canStart} title={!row.canStart ? "Available starting 1 hour before slot time" : undefined} size="sm" type="button" onClick={() => void runAction(() => dispatch(startBookingThunk(row.bookingId)).unwrap(), "Unable to start this job.")}>Start job</Button>{!row.canStart && <span className="text-[11px] text-slate-500">Opens 1h before slot</span>}</div> : row.status === "in_progress" ? <Button disabled={isMutating} size="sm" type="button" onClick={() => void runAction(() => dispatch(requestCompletionThunk(row.bookingId)).unwrap(), "Unable to request completion confirmation.")}>Request completion</Button> : <span className="text-xs text-slate-500">{row.status === "completion_requested" ? "Awaiting customer" : row.status === "disputed" ? "Disputed · awaiting review" : "—"}</span> },
  ];
  if (!isProvider) return <p className="rounded-xl border bg-card p-6">Provider access required.</p>;
  return <div className="rounded-xl border bg-card p-6"><h1 className="mb-4 text-2xl font-bold text-slate-800">Assigned Jobs</h1>{isLoading && <p>Loading assigned jobs...</p>}{isError && <p className="text-red-600">Unable to load assigned jobs.</p>}{actionError && <p className="text-red-600">{actionError}</p>}{!isLoading && !isError && jobs.length === 0 && <p>No jobs assigned.</p>}{!isLoading && !isError && jobs.length > 0 && <DataTable columns={columns} data={jobs} rowKey="bookingId" />}</div>;
}
