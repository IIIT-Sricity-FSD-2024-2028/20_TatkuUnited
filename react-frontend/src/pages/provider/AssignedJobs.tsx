import { useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { BookingDocument } from "@/models/api.models";
import { useGetProviderBookingsQuery, useGetProviderByUserQuery, useRequestBookingCompletionMutation, useStartBookingMutation } from "@/store/provider/provider-api";
import DataTable, { type Column } from "./DataTable";
import { formatProviderTime, getErrorMessage } from "./provider-utils";

type JobRow = { bookingId: string; serviceName: string; customerName: string; serviceAddress: string; scheduledDate: string; startTime: string; status: BookingDocument["status"] };

function toJobRow(booking: BookingDocument): JobRow {
  const order = typeof booking.order === "object" && booking.order !== null ? booking.order : undefined;
  return {
    bookingId: booking._id,
    serviceName: typeof booking.service === "object" ? booking.service.name : "Unknown service",
    customerName: typeof booking.customer === "object" ? booking.customer.name : "Unknown customer",
    serviceAddress: [order?.address?.line, order?.address?.city].filter(Boolean).join(", "),
    scheduledDate: new Date(booking.scheduledDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
    startTime: formatProviderTime(booking.startTime), status: booking.status,
  };
}

export default function AssignedJobs() {
  const { user } = useAuth();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const [actionError, setActionError] = useState<string | null>(null);
  const providerQuery = useGetProviderByUserQuery(user?.id ?? "", { skip: !isProvider });
  const bookingsQuery = useGetProviderBookingsQuery(providerQuery.data?._id ?? "", { skip: !providerQuery.data?._id, pollingInterval: 6000 });
  const [startBooking, startState] = useStartBookingMutation();
  const [requestCompletion, completionState] = useRequestBookingCompletionMutation();
  const isMutating = startState.isLoading || completionState.isLoading;
  const jobs = (bookingsQuery.data ?? []).map(toJobRow);
  const runAction = async (action: () => Promise<unknown>, fallback: string) => {
    setActionError(null); try { await action(); } catch (error) { setActionError(getErrorMessage(error, fallback)); }
  };
  const columns: Column<JobRow>[] = [
    { key: "serviceName", label: "Service Name" }, { key: "customerName", label: "Customer Name" }, { key: "serviceAddress", label: "Address" }, { key: "scheduledDate", label: "Date" }, { key: "startTime", label: "Time" }, { key: "status", label: "Status" },
    { key: "bookingId", label: "Action", render: (_value, row) => row.status === "confirmed" ? <Button disabled={isMutating} size="sm" type="button" onClick={() => void runAction(() => startBooking(row.bookingId).unwrap(), "Unable to start this job.")}>Start job</Button> : row.status === "in_progress" ? <Button disabled={isMutating} size="sm" type="button" onClick={() => void runAction(() => requestCompletion(row.bookingId).unwrap(), "Unable to request completion confirmation.")}>Request completion</Button> : <span className="text-xs text-slate-500">{row.status === "completion_requested" ? "Awaiting customer" : row.status === "disputed" ? "Disputed · awaiting review" : "—"}</span> },
  ];
  if (!isProvider) return <p className="rounded-xl border bg-card p-6">Provider access required.</p>;
  return <div className="rounded-xl border bg-card p-6"><h1 className="mb-4 text-2xl font-bold text-slate-800">Assigned Jobs</h1>{bookingsQuery.isLoading && <p>Loading assigned jobs...</p>}{bookingsQuery.isError && <p className="text-red-600">Unable to load assigned jobs.</p>}{actionError && <p className="text-red-600">{actionError}</p>}{!bookingsQuery.isLoading && !bookingsQuery.isError && jobs.length === 0 && <p>No jobs assigned.</p>}{!bookingsQuery.isLoading && !bookingsQuery.isError && jobs.length > 0 && <DataTable columns={columns} data={jobs} rowKey="bookingId" />}</div>;
}
