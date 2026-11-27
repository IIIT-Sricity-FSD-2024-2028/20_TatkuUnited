import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  BookingActions,
  cancelBookingThunk,
  confirmCompletion,
  fetchCustomerBookings,
  rejectCompletion,
} from "@/store/booking/booking-slice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingDocument } from "@/models/api.models";

const labels: Record<string, string> = {
  awaiting_provider: "Finding a provider",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completion_requested: "Confirm completion",
  disputed: "Completion disputed",
  cancelled: "Cancelled",
  completed: "Completed",
  pending: "Pending",
};
function time(minutes: number) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}
function notice(booking: BookingDocument) {
  const order = typeof booking.order === "object" ? booking.order : null;
  if (booking.status === "disputed")
    return "You reported that the work is incomplete. Completion and payout are paused for administrator review. The provider cannot send repeated completion requests.";
  if (order?.paymentStatus === "failed")
    return "Payment failed or expired. Return to your cart and check out again.";
  if (booking.status === "cancelled")
    return [
      booking.cancelledReason || "This booking was cancelled.",
      order?.paymentStatus === "refunded"
        ? "Payment refunded."
        : order?.paymentStatus === "partially_refunded"
          ? "This order has a partial refund; see payment details."
          : "",
    ]
      .filter(Boolean)
      .join(" ");
  if (order?.paymentStatus === "created")
    return "Payment is required before we contact providers.";
  if (booking.status === "awaiting_provider")
    return "We are contacting available providers. If no one accepts after the matching rounds, this booking will be cancelled and refunded.";
  if (booking.status === "completion_requested")
    return "Your provider marked the work done. Confirm only if the service is complete. Reporting incomplete work pauses completion for administrator review.";
  return "";
}

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const customerId = useSelector((state: RootState) => state.auth.user?.id);
  const {
    items: bookings,
    loading: sliceLoading,
    actingId: acting,
    error,
  } = useSelector((state: RootState) => state.booking);
  const loading = sliceLoading && bookings.length === 0;
  const [cancellingBooking, setCancellingBooking] =
    useState<BookingDocument | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // load, then keep the list fresh while the page is open
  useEffect(() => {
    if (!customerId) return;
    dispatch(fetchCustomerBookings(customerId));
    const timer = setInterval(
      () => dispatch(fetchCustomerBookings(customerId)),
      6000,
    );
    return () => clearInterval(timer);
  }, [dispatch, customerId]);

  const decide = async (booking: BookingDocument, complete: boolean) => {
    if (acting !== null) return;
    try {
      if (complete) {
        await dispatch(confirmCompletion(booking._id)).unwrap();
        navigate("/customer/ratings-feedback?bookingId=" + booking._id);
      } else {
        await dispatch(rejectCompletion(booking._id)).unwrap();
      }
    } catch {
      // the message is in state.booking.error
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking || acting !== null) return;
    try {
      await dispatch(
        cancelBookingThunk({
          id: cancellingBooking._id,
          cancelledBy: "customer",
          reason: cancelReason.trim() || "Cancelled by customer",
        }),
      ).unwrap();
      setCancellingBooking(null);
      setCancelReason("");
    } catch {
      // the message is in state.booking.error
    }
  };

  const visible = id
    ? bookings.filter((booking) => booking._id === id)
    : bookings;
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your appointments, payments and service updates.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/services")}>
          Browse services
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive p-4 text-sm"
        >
          {error}{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(BookingActions.clearBookingError());
              if (customerId) dispatch(fetchCustomerBookings(customerId));
            }}
          >
            Refresh
          </Button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading bookings…</p>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p>{id ? "Booking not found." : "You have no bookings yet."}</p>
            <Button
              className="mt-4"
              onClick={() => navigate(id ? "/customer/bookings" : "/services")}
            >
              {id ? "All bookings" : "Find a service"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        visible.map((booking) => {
          const service =
            typeof booking.service === "object" ? booking.service : null;
          const provider =
            typeof booking.provider === "object" ? booking.provider : null;
          const providerUser =
            provider && typeof provider.user === "object"
              ? provider.user
              : null;
          const order =
            typeof booking.order === "object" ? booking.order : null;
          return (
            <Card key={booking._id}>
              <CardContent className="space-y-4 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      {service?.name || "Service booking"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(booking.scheduledDate).toLocaleDateString(
                        "en-IN",
                        {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}{" "}
                      · {time(booking.startTime)}–{time(booking.endTime)} IST
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {order?.paymentStatus === "created"
                      ? "Awaiting payment"
                      : labels[booking.status] || booking.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-between gap-3 text-sm">
                  <div>
                    {providerUser?.name && <p>Provider: {providerUser.name}</p>}
                    {order?.address && (
                      <p className="text-muted-foreground">
                        {order.address.line}, {order.address.city}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(booking.price / 100)}
                  </p>
                </div>
                {notice(booking) && (
                  <p className="rounded-lg bg-muted p-3 text-sm">
                    {notice(booking)}
                  </p>
                )}
                {booking.status === "completion_requested" && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={acting !== null}
                      onClick={() => void decide(booking, true)}
                    >
                      Confirm complete
                    </Button>
                    <Button
                      variant="outline"
                      disabled={acting !== null}
                      onClick={() => void decide(booking, false)}
                    >
                      Report incomplete work
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {order && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/customer/pay/" + order._id)}
                    >
                      Payment details
                    </Button>
                  )}
                  {["pending", "awaiting_provider", "confirmed"].includes(
                    booking.status,
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      disabled={acting !== null}
                      onClick={() => {
                        setCancelReason("");
                        setCancellingBooking(booking);
                      }}
                    >
                      Cancel booking
                    </Button>
                  )}
                  {booking.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          "/customer/ratings-feedback?bookingId=" + booking._id,
                        )
                      }
                    >
                      Rate service
                    </Button>
                  )}
                  {["completed", "cancelled"].includes(booking.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          service?._id
                            ? "/customer/schedule/" + service._id
                            : typeof booking.service === "string"
                              ? "/customer/schedule/" + booking.service
                              : "/services",
                        )
                      }
                    >
                      Book again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog
        open={cancellingBooking !== null}
        onOpenChange={(open: boolean) => {
          if (!open && acting === null) {
            setCancellingBooking(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              This will cancel your booking
              {cancellingBooking &&
              typeof cancellingBooking.service === "object" &&
              cancellingBooking.service?.name
                ? ` for ${cancellingBooking.service.name}`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Input
              id="cancel-reason"
              placeholder="e.g. Plans changed"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={acting !== null}
              onClick={() => setCancellingBooking(null)}
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={acting !== null}
              onClick={() => void handleConfirmCancel()}
            >
              {acting !== null ? "Cancelling…" : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
