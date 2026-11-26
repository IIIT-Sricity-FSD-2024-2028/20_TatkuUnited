import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import {
  cancelRegionBooking,
  completeRegionBooking,
} from "../../store/manager/manager-slice";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "../../components/ui/toast";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

type BookingAction = "complete" | "cancel";

// statuses the backend lets a manager complete / cancel
const COMPLETABLE = ["in_progress", "completion_requested", "disputed"];
const CANCELLABLE = [
  "pending",
  "awaiting_provider",
  "confirmed",
  "in_progress",
  "completion_requested",
  "disputed",
];

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  disputed: "bg-orange-100 text-orange-800",
};

export default function ManagerManageBookings() {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings, services, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  const loading = pending > 0;
  const [confirming, setConfirming] = useState<{
    id: string;
    label: string;
    action: BookingAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setConfirming(null);
    setReason("");
  };

  const confirmAction = async () => {
    if (!confirming) return;
    const { id, label, action } = confirming;
    setSaving(true);
    try {
      if (action === "complete") {
        await dispatch(completeRegionBooking(id)).unwrap();
      } else {
        await dispatch(
          cancelRegionBooking({ id, reason: reason.trim() || undefined }),
        ).unwrap();
      }
      toast.add({
        type: "info",
        description: `${label} ${action === "complete" ? "completed" : "cancelled"}`,
      });
      close();
    } catch {
      toast.add({
        type: "error",
        description: `Could not ${action} ${label}`,
        priority: "high",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete or cancel bookings in your region
        </p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Region Bookings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!loading && bookings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No bookings in this region yet.
            </p>
          )}
          {!loading &&
            bookings.map((b) => {
              // refs can be plain ids, populated objects, or null if the record was removed
              const serviceName =
                typeof b.service === "string"
                  ? (services.find((s) => s._id === b.service)?.name ?? "Service")
                  : (b.service?.name ?? "Unknown service");
              const customerName =
                typeof b.customer === "string"
                  ? "Customer"
                  : (b.customer?.name ?? "Unknown customer");
              const label = `${serviceName} for ${customerName}`;
              return (
                <Card key={b._id} className="w-full">
                  <CardHeader>
                    <CardTitle>{serviceName}</CardTitle>
                    <CardDescription>
                      {customerName} ·{" "}
                      {new Date(b.scheduledDate).toLocaleDateString("en-IN")}
                    </CardDescription>
                    <CardAction className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLES[b.status] ?? "bg-slate-100 text-slate-800"}`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </span>
                      {COMPLETABLE.includes(b.status) && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirming({ id: b._id, label, action: "complete" })
                          }
                        >
                          Complete
                        </Button>
                      )}
                      {CANCELLABLE.includes(b.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirming({ id: b._id, label, action: "cancel" })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </CardAction>
                  </CardHeader>
                </Card>
              );
            })}
        </CardContent>
      </Card>
      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => !open && !saving && close()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirming?.action === "complete" ? "Complete" : "Cancel"} booking?
            </DialogTitle>
            <DialogDescription>
              {confirming?.action === "complete"
                ? `${confirming?.label} will be marked as completed.`
                : `${confirming?.label} will be cancelled.`}
            </DialogDescription>
          </DialogHeader>
          {confirming?.action === "cancel" && (
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={close}>
              Back
            </Button>
            <Button disabled={saving} onClick={confirmAction}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
