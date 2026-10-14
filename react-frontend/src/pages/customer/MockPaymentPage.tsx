import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import Footer from "../general/landing/Footer";
import { getOrderDetails } from "@/services/orders.service";
import { simulatePayment, type SimulatePaymentResponse } from "@/services/payments.service";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";

function formatSlotTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

export default function MockPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulatePaymentResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided in URL.");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getOrderDetails(orderId);
        setOrder(data);

        if (data.paymentStatus === "paid") {
          const payObj = typeof data.payment === "object" ? (data.payment as any) : null;
          setResult({
            success: true,
            orderId,
            paymentStatus: "paid",
            paymentId: payObj?.razorpayPaymentId || "mock_pay_completed",
            message: "Payment received, finding a provider",
          });
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load order details.";
        setError(Array.isArray(msg) ? msg.join(", ") : msg);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Countdown timer for 15-minute order expiry
  useEffect(() => {
    if (!order?.expiresAt || order.paymentStatus === "paid" || result?.success) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const expTime = new Date(order.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order, result]);

  const formattedTimeLeft = useMemo(() => {
    if (timeLeft === null) return null;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, [timeLeft]);

  const handleSimulate = async (success: boolean) => {
    if (!orderId || processing) return;
    setProcessing(true);
    setError("");

    try {
      const res = await simulatePayment(orderId, success);
      setResult(res);

      if (res.success) {
        // Refresh local order state
        setOrder((prev: any) => ({
          ...prev,
          paymentStatus: "paid",
        }));
      } else {
        setOrder((prev: any) => ({
          ...prev,
          paymentStatus: res.paymentStatus || "failed",
        }));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Payment simulation encountered an error.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setProcessing(false);
    }
  };

  const amountRupees = order ? (order.totalAmount / 100).toFixed(2) : "0.00";
  const isExpired = timeLeft === 0 || order?.paymentStatus === "refunded";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex flex-col justify-between">
      <div>
        <PublicNavbar
          brandName="TatkuUnited"
          brandInitials="TU"
          onNavigate={(path) => navigate(path)}
        />

        <main className="max-w-3xl mx-auto px-4 pt-32 pb-20">
          {/* Top Breadcrumb */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/customer/cart"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="h-3 w-3" />
              Mock Payment Gateway (Razorpay Simulator)
            </div>
          </div>

          {/* Loading View */}
          {loading && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-700 font-medium">Loading checkout order...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Transaction Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Order Details & Payment Card */}
          {!loading && order && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/80">
              {/* Header Banner */}
              <div className="bg-slate-900 px-6 py-6 text-white sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Checkout Payment
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                      ₹{amountRupees}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Order #{order._id?.slice(-8) || orderId?.slice(-8)}
                    </p>
                  </div>

                  {/* Expiry Countdown Chip */}
                  {timeLeft !== null && !result?.success && (
                    <div
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                        timeLeft < 180
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span>
                        {timeLeft > 0 ? (
                          <>Time to complete: <strong className="font-mono text-white">{formattedTimeLeft}</strong></>
                        ) : (
                          <strong className="text-red-400">Order Expired</strong>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Result State: Success */}
                {result?.success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-900">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-emerald-950">
                          Payment Successful
                        </h2>
                        <p className="mt-1 text-sm font-medium text-emerald-800">
                          {result.message || "Payment received, finding a provider"}
                        </p>
                        {result.paymentId && (
                          <p className="mt-2 text-xs text-emerald-700 font-mono">
                            Payment ID: {result.paymentId}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => navigate("/customer/bookings")}
                            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                          >
                            View My Bookings
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/customer/dashboard")}
                            className="rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            Go to Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result State: Failure / Expired */}
                {result && !result.success && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <XCircle className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-red-950">
                          {isExpired ? "Order Expired" : "Payment Failed"}
                        </h2>
                        <p className="mt-1 text-sm text-red-800">
                          {result.message}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => navigate("/customer/cart")}
                            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition cursor-pointer"
                          >
                            Return to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulate(true)}
                            disabled={processing || isExpired}
                            className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                          >
                            Retry Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary & Items */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Details & Address
                  </h3>

                  {order.address && (
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-slate-900">Service Location: </span>
                        <span>{order.address.line}, {order.address.city}</span>
                      </div>
                    </div>
                  )}

                  {/* Bookings / Services list */}
                  {Array.isArray(order.bookings) && order.bookings.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Booked Service Slots
                      </span>
                      {order.bookings.map((b: any, idx: number) => {
                        const serviceName = b.service?.name || "Service Booking";
                        const price = (b.price / 100).toFixed(2);
                        const dateStr = b.scheduledDate
                          ? new Date(b.scheduledDate).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })
                          : "";
                        const timeStr = `${formatSlotTime(b.startTime)} - ${formatSlotTime(b.endTime)}`;

                        return (
                          <div
                            key={b._id || idx}
                            className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{serviceName}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {dateStr} at {timeStr}
                              </p>
                            </div>
                            <span className="font-bold text-slate-800">₹{price}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment Simulation Controls */}
                {!result?.success && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                      <span>Simulate Payment Response</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This simulates Razorpay payment webhook and capture callbacks. Click <strong>Pay successfully</strong> to confirm payment and trigger provider matching, or <strong>Fail payment</strong> to test cancellation and retry flow.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSimulate(true)}
                        disabled={processing || isExpired}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        Pay successfully (₹{amountRupees})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulate(false)}
                        disabled={processing || isExpired}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                        Fail payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
