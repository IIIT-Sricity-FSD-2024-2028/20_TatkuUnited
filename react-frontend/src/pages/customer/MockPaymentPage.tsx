import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppDispatch, RootState } from "@/store";
import {
  CustomerActions,
  fetchOrder,
  payOrder,
} from "@/store/customer/customer-slice";
import { toast } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function MockPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentOrder, pending, paying: processing, error: storeError } =
    useSelector((state: RootState) => state.customer);
  // only show the order that matches this URL, never a stale one from before
  const order = currentOrder?._id === orderId ? currentOrder : null;
  const loading = pending > 0 && !order;
  const error = !orderId ? "Order not found." : storeError ?? "";
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  // clock for the payment-window countdown (UI-only)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    dispatch(CustomerActions.clearError());
    if (orderId) dispatch(fetchOrder(orderId));
  }, [dispatch, orderId]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = order
    ? Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - now) / 1000))
    : 0;
  const payable = order?.paymentStatus === "created" && seconds > 0;
  const status = order?.paymentStatus;
  const message =
    status === "paid"
      ? "Payment received. View your bookings for provider assignment and service updates."
      : status === "refunded"
        ? "This order has been refunded. View your bookings for details."
        : status === "partially_refunded"
          ? "Part of this order has been refunded. Check each booking for its current status."
          : status === "failed"
            ? "Payment failed. Your cart is saved. Return to your cart and check out again to create a new order."
            : !payable
              ? "This payment window has expired. Return to your cart to check availability and create a new order."
              : "Complete payment to begin finding a provider. If no provider accepts, the booking will be cancelled and refunded.";

  async function pay(e: React.MouseEvent, success: boolean) {
    e.preventDefault();
    if (!orderId || !payable || processing) return;
    setFeedback(null);
    try {
      const updated = await dispatch(payOrder({ orderId, success })).unwrap();
      if (success && updated.paymentStatus === "paid") {
        setFeedback({
          type: "success",
          message:
            "Payment received successfully! Your booking is confirmed and providers are being notified.",
        });
        toast.add({
          title: "Payment Successful",
          description:
            "Payment received. View your bookings for provider assignment.",
          type: "success",
        });
      } else {
        setFeedback({
          type: "error",
          message:
            "Payment failed. Your cart is preserved so you can return to your cart and check out again.",
        });
        toast.add({
          title: "Payment Failed",
          description:
            "Payment could not be completed. Your cart is saved so you can retry checkout.",
          type: "error",
        });
      }
    } catch {
      // the error is in state.customer.error; reload the order's real state
      dispatch(fetchOrder(orderId));
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your order and payment status.
        </p>
      </div>

      {feedback?.type === "success" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950">Payment Successful</p>
            <p className="text-emerald-800">{feedback.message}</p>
          </div>
        </div>
      )}

      {feedback?.type === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-50 p-4 text-sm text-red-900"
        >
          <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-950">Payment Failed</p>
            <p className="text-red-800">{feedback.message}</p>
          </div>
        </div>
      )}

      {loading && <p role="status">Loading order…</p>}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => orderId && dispatch(fetchOrder(orderId))}
            >
              Refresh order
            </Button>
          </div>
        </div>
      )}

      {!loading && order && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Order #{order._id.slice(-8)}</CardTitle>
              <Badge
                variant={
                  status === "paid"
                    ? "default"
                    : status === "failed"
                      ? "destructive"
                      : "secondary"
                }
              >
                {status?.replaceAll("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-3xl font-semibold">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(order.totalAmount / 100)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.address?.line}, {order.address?.city}
            </p>
            <p role="status" className="rounded-lg bg-muted p-4 text-sm">
              {message}
            </p>
            {payable && (
              <>
                <p className="text-sm text-muted-foreground">
                  Payment window: {Math.floor(seconds / 60)}:
                  {String(seconds % 60).padStart(2, "0")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Demo payment. No real money will be charged.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={processing}
                    onClick={(e: React.MouseEvent) => void pay(e, true)}
                    className="cursor-pointer"
                  >
                    {processing ? "Processing…" : "Pay successfully"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processing}
                    onClick={(e: React.MouseEvent) => void pay(e, false)}
                    className="cursor-pointer"
                  >
                    {processing ? "Processing…" : "Fail payment"}
                  </Button>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                variant={status === "paid" ? "default" : "outline"}
                disabled={processing}
                onClick={() => navigate("/customer/bookings")}
                className="cursor-pointer"
              >
                View bookings
              </Button>
              <Button
                type="button"
                variant={status === "failed" ? "default" : "ghost"}
                disabled={processing}
                onClick={() => navigate("/customer/cart")}
                className="cursor-pointer"
              >
                Return to cart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
