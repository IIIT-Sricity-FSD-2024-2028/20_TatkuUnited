import { useCallback, useEffect, useRef, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { BookingDocument } from "@/models/api.models";
import { getBookingsByProvider, requestBookingCompletion, startBooking } from "@/services/bookings.service";
import DataTable, { type Column } from "./DataTable";
import { formatProviderTime, getErrorMessage } from "./provider-utils";
import { useProviderData } from "./ProviderDataContext";

type JobRow = { bookingId: string; serviceName: string; customerName: string; serviceAddress: string; scheduledDate: string; startTime: string; status: BookingDocument["status"] };
function toJobRow(booking: BookingDocument): JobRow {
  const order = typeof booking.order === "object" && booking.order !== null ? booking.order : undefined;
  return { bookingId: booking._id, serviceName: typeof booking.service === "object" ? booking.service.name : "Unknown service", customerName: typeof booking.customer === "object" ? booking.customer.name : "Unknown customer", serviceAddress: [order?.address?.line, order?.address?.city].filter(Boolean).join(", "), scheduledDate: new Date(booking.scheduledDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }), startTime: formatProviderTime(booking.startTime), status: booking.status };
}

export default function AssignedJobs() {
  const { user } = useAuth(); const { provider } = useProviderData(); const isProvider = user?.role === RolesEnum.PROVIDER;
  const [bookings, setBookings] = useState<BookingDocument[]>([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState<string | null>(null); const [actionError, setActionError] = useState<string | null>(null); const [actingId, setActingId] = useState<string | null>(null); const requestInFlight = useRef(false);
  const loadBookings = useCallback(async () => { if (!provider?._id || requestInFlight.current) return; requestInFlight.current = true; try { setBookings(await getBookingsByProvider(provider._id)); setLoadError(null); } catch (error) { setLoadError(getErrorMessage(error, "Unable to load assigned jobs.")); } finally { requestInFlight.current = false; setLoading(false); } }, [provider?._id]);
  useEffect(() => { if (!provider?._id) return; void loadBookings(); const interval = window.setInterval(() => void loadBookings(), 6000); return () => window.clearInterval(interval); }, [provider?._id, loadBookings]);
  const runAction = useCallback(async (bookingId: string, action: (id: string) => Promise<BookingDocument>, fallback: string) => { setActionError(null); setActingId(bookingId); try { await action(bookingId); await loadBookings(); } catch (error) { setActionError(getErrorMessage(error, fallback)); } finally { setActingId(null); } }, [loadBookings]);
  const jobs = bookings.map(toJobRow);
  const columns: Column<JobRow>[] = [{ key: "serviceName", label: "Service Name" }, { key: "customerName", label: "Customer Name" }, { key: "serviceAddress", label: "Address" }, { key: "scheduledDate", label: "Date" }, { key: "startTime", label: "Time" }, { key: "status", label: "Status" }, { key: "bookingId", label: "Action", render: (_value, row) => row.status === "confirmed" ? <Button disabled={actingId !== null} size="sm" type="button" onClick={() => void runAction(row.bookingId, startBooking, "Unable to start this job.")}>{actingId === row.bookingId ? "Starting..." : "Start job"}</Button> : row.status === "in_progress" ? <Button disabled={actingId !== null} size="sm" type="button" onClick={() => void runAction(row.bookingId, requestBookingCompletion, "Unable to request completion confirmation.")}>{actingId === row.bookingId ? "Requesting..." : "Request completion"}</Button> : <span className="text-xs text-slate-500">{row.status === "completion_requested" ? "Awaiting customer" : row.status === "disputed" ? "Disputed · awaiting review" : "—"}</span> }];
  if (!isProvider) return <p className="rounded-xl border bg-card p-6">Provider access required.</p>;
  return <div className="rounded-xl border bg-card p-6"><h1 className="mb-4 text-2xl font-bold text-slate-800">Assigned Jobs</h1>{loading && <p>Loading assigned jobs...</p>}{loadError && <p className="text-red-600">{loadError}</p>}{actionError && <p className="text-red-600">{actionError}</p>}{!loading && !loadError && jobs.length === 0 && <p>No jobs assigned.</p>}{!loading && !loadError && jobs.length > 0 && <DataTable columns={columns} data={jobs} rowKey="bookingId" />}</div>;
}
