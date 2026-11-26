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

  async function pay(success: boolean) {
    if (!orderId || !payable || processing) return;
    try {
      await dispatch(payOrder({ orderId, success })).unwrap();
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
      {loading && <p role="status">Loading order…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive p-4 text-sm"
        >
          {error}{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => orderId && dispatch(fetchOrder(orderId))}
          >
            Refresh order
          </Button>
        </div>
      )}
      {!loading && order && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Order #{order._id.slice(-8)}</CardTitle>
              <Badge variant="secondary">{status?.replaceAll("_", " ")}</Badge>
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
                  <Button disabled={processing} onClick={() => void pay(true)}>
                    {processing ? "Processing…" : "Pay successfully"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={processing}
                    onClick={() => void pay(false)}
                  >
                    Fail payment
                  </Button>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={processing}
                onClick={() => navigate("/customer/bookings")}
              >
                View bookings
              </Button>
              <Button
                variant="ghost"
                disabled={processing}
                onClick={() => navigate("/customer/cart")}
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
