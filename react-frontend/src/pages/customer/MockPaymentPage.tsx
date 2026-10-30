import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrderDetails } from "@/services/orders.service";
import { simulatePayment } from "@/services/payments.service";
import type { OrderDocument } from "@/models/api.models";

export default function MockPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const busy = useRef(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setOrder(null);
    setLoading(true);
    setError("");
    if (!orderId) {
      setError("Order not found.");
      setLoading(false);
      return;
    }
    getOrderDetails(orderId)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        if (active) setError("Unable to load this order. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, reload]);
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
    if (!orderId || !payable || busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError("");
    try {
      const result = await simulatePayment(orderId, success);
      setOrder((current) =>
        current
          ? {
              ...current,
              paymentStatus:
                result.paymentStatus as OrderDocument["paymentStatus"],
            }
          : current,
      );
      // Read authoritative state, including an immediate matching cancellation/refund.
      const fresh = await getOrderDetails(orderId);
      setOrder(fresh);
    } catch {
      setError(
        "We could not verify the payment result. Refresh the order before trying again.",
      );
      setReload((value) => value + 1);
    } finally {
      busy.current = false;
      setProcessing(false);
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
            onClick={() => setReload((v) => v + 1)}
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
