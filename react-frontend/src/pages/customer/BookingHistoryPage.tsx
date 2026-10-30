import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "@/common/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  confirmBookingCompletion,
  getBookingsByCustomer,
  rejectBookingCompletion,
} from "@/services/bookings.service";
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
  const { authDetails } = useAuthContext();
  const customerId = authDetails?.user.id;
  const [bookings, setBookings] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const busy = useRef(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      if (!customerId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBookingsByCustomer(customerId);
        if (active && !busy.current) {
          setBookings(data);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "Unable to refresh bookings. Displayed details may be out of date.",
          );
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(refresh, 6000);
        }
      }
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerId, reload]);

  const decide = useCallback(
    async (booking: BookingDocument, complete: boolean) => {
      if (busy.current) return;
      busy.current = true;
      setActing(booking._id);
      setError("");
      try {
        const updated = await (complete
          ? confirmBookingCompletion(booking._id)
          : rejectBookingCompletion(booking._id));
        setBookings((items) =>
          items.map((item) => (item._id === booking._id ? updated : item)),
        );
        if (complete)
          navigate("/customer/ratings-feedback?bookingId=" + booking._id);
      } catch {
        setError(
          "This booking may have changed. Refresh to check its current status before trying again.",
        );
      } finally {
        busy.current = false;
        setActing(null);
      }
    },
    [navigate],
  );

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
            onClick={() => setReload((v) => v + 1)}
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
    </section>
  );
}
