import { useState, useEffect, useCallback } from "react";
import {
  getMyPendingOffers,
  getProviderOffers,
  acceptBooking,
  rejectBooking,
} from "@/services/bookings.service";
import type { BookingDocument, ServiceDocument, UserDocument } from "@/models/api.models";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { notifiedOfferIds } from "./useIncomingOfferNotifier";
import {
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Coins,
  Radio,
} from "lucide-react";

interface IncomingOffersProps {
  providerId?: string;
  onJobAccepted?: (booking: BookingDocument) => void;
}

function formatSlotTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function playOfferChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore audio permission/context errors
  }
}

export default function IncomingOffers({
  providerId,
  onJobAccepted,
}: IncomingOffersProps) {
  const [offers, setOffers] = useState<BookingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick current time every second for countdown timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = useCallback(
    async (bookingId: string, toastId?: string) => {
      setActingId(bookingId);
      try {
        const accepted = await acceptBooking(bookingId, providerId);
        toast.add({
          type: "success",
          title: "🎉 Job Accepted!",
          description: "Booking confirmed and added to your assigned schedule.",
          priority: "high",
        });

        // Remove from local offers list
        setOffers((prev) => prev.filter((b) => b._id !== bookingId));
        if (toastId) toast.close(toastId);

        onJobAccepted?.(accepted);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        const msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not accept offer.";

        if (status === 409 || (typeof msg === "string" && msg.includes("already taken"))) {
          toast.add({
            type: "warning",
            title: "Job Already Taken",
            description: "Another service provider accepted this job offer first.",
            priority: "high",
          });
          // Remove since it's taken
          setOffers((prev) => prev.filter((b) => b._id !== bookingId));
        } else {
          toast.add({
            type: "error",
            title: "Accept Failed",
            description: Array.isArray(msg) ? msg.join(", ") : String(msg),
          });
        }
        if (toastId) toast.close(toastId);
      } finally {
        setActingId(null);
      }
    },
    [providerId, onJobAccepted],
  );

  const handleDecline = useCallback(
    async (bookingId: string, toastId?: string) => {
      setActingId(bookingId);
      try {
        await rejectBooking(bookingId, providerId);
        toast.add({
          type: "info",
          title: "Offer Declined",
          description: "The job offer was declined and will be reassigned.",
        });

        setOffers((prev) => prev.filter((b) => b._id !== bookingId));
        if (toastId) toast.close(toastId);
      } catch (err: any) {
        const msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not decline offer.";
        toast.add({
          type: "error",
          title: "Decline Failed",
          description: Array.isArray(msg) ? msg.join(", ") : String(msg),
        });
        if (toastId) toast.close(toastId);
      } finally {
        setActingId(null);
      }
    },
    [providerId],
  );

  const fetchOffers = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const data = providerId
        ? await getProviderOffers(providerId)
        : await getMyPendingOffers();

      const activeOffers = (data || []).filter((b) => {
        // Find provider's offer entry or general expiry
        const myOffer = b.offers?.find(
          (o) =>
            (!providerId || String(o.provider) === String(providerId)) &&
            o.status === "offered",
        );
        if (myOffer && myOffer.expiresAt) {
          return new Date(myOffer.expiresAt).getTime() > Date.now();
        }
        if (b.offerExpiresAt) {
          return new Date(b.offerExpiresAt).getTime() > Date.now();
        }
        return b.status === "awaiting_provider";
      });

      setOffers(activeOffers);

      // Check for new offers that haven't been toasted yet
      let hasNewOffer = false;
      for (const booking of activeOffers) {
        if (!notifiedOfferIds.has(booking._id)) {
          notifiedOfferIds.add(booking._id);
          hasNewOffer = true;

          const serviceName =
            typeof booking.service === "object" && booking.service !== null
              ? (booking.service as ServiceDocument).name
              : "Service Job";

          const customerName =
            typeof booking.customer === "object" && booking.customer !== null
              ? (booking.customer as UserDocument).name
              : "Customer";

          const payout = booking.providerShare
            ? Math.round(booking.providerShare / 100)
            : Math.round(booking.price / 100);

          const timeSlot = `${formatSlotTime(booking.startTime)} - ${formatSlotTime(booking.endTime)}`;

          // Fire toast with Accept and Decline buttons
          toast.add({
            type: "info",
            title: `⚡ New Job Offer: ${serviceName}`,
            description: `${customerName} • ${timeSlot} • Payout: ₹${payout}`,
            priority: "high",
            timeout: 60000, // 60s
            actions: ({ id }: { id: string }) => (
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-7 px-3 cursor-pointer shadow-sm"
                  onClick={() => handleAccept(booking._id, id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2.5 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleDecline(booking._id, id)}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Decline
                </Button>
              </div>
            ),
          } as any);
        }
      }

      if (hasNewOffer) {
        playOfferChime();
      }
    } catch {
      // Background poll silently fails on network jitter
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, handleAccept, handleDecline]);

  // Initial fetch and periodic background poll every 6 seconds
  useEffect(() => {
    fetchOffers(true);
    const interval = setInterval(() => {
      fetchOffers(false);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchOffers]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Incoming Job Offers</h2>
              {offers.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {offers.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live matching engine dispatches offers in real-time. Accept fast before the timer lapses!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOffers(false)}
            disabled={refreshing}
            className="text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-200 h-8 cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin text-amber-600" : ""}`}
            />
            {refreshing ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Offer Cards */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-2" />
          <p className="text-sm">Checking for available job offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Radio className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No Pending Job Offers</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            You are online and eligible. When a customer in your service radius books a matching
            service, an offer card and notification will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((booking) => {
            const serviceName =
              typeof booking.service === "object" && booking.service !== null
                ? (booking.service as ServiceDocument).name
                : "Service";

            const serviceDuration =
              typeof booking.service === "object" && booking.service !== null
                ? (booking.service as ServiceDocument).duration
                : null;

            const customerName =
              typeof booking.customer === "object" && booking.customer !== null
                ? (booking.customer as UserDocument).name
                : "Customer";

            const customerPhone =
              typeof booking.customer === "object" && booking.customer !== null
                ? (booking.customer as UserDocument).phone
                : null;

            const addressLine =
              (booking.order as any)?.address?.line ||
              (booking.order as any)?.address?.city ||
              "Customer Address";

            const city = (booking.order as any)?.address?.city;

            const payout = booking.providerShare
              ? Math.round(booking.providerShare / 100)
              : Math.round(booking.price / 100);

            // Find expiration timestamp
            const myOffer = booking.offers?.find(
              (o) =>
                (!providerId || String(o.provider) === String(providerId)) &&
                o.status === "offered",
            );
            const expiresAtMs = myOffer?.expiresAt
              ? new Date(myOffer.expiresAt).getTime()
              : booking.offerExpiresAt
                ? new Date(booking.offerExpiresAt).getTime()
                : now + 120000;

            const secondsRemaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
            const mins = Math.floor(secondsRemaining / 60);
            const secs = secondsRemaining % 60;
            const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

            const isUrgent = secondsRemaining < 30;
            const isActing = actingId === booking._id;

            const dateStr = booking.scheduledDate
              ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Today";

            return (
              <div
                key={booking._id}
                className="relative flex flex-col justify-between rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top badge row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Round {booking.offerRound || 1} Offer
                    </span>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isUrgent
                          ? "bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/30 animate-pulse"
                          : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{secondsRemaining > 0 ? `${timeStr} left` : "Expired"}</span>
                    </div>
                  </div>

                  {/* Title & Payout */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{serviceName}</h3>
                      {serviceDuration && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Estimated duration: {serviceDuration} minutes
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-lg">
                        <Coins className="w-4 h-4 text-emerald-500" />
                        ₹{payout}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase">
                        Net Payout
                      </span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs mb-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900">{dateStr}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-700">
                        {formatSlotTime(booking.startTime)} - {formatSlotTime(booking.endTime)}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {addressLine}
                        {city && city !== addressLine ? `, ${city}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Customer: <strong className="text-slate-800">{customerName}</strong></span>
                      {customerPhone && <span className="font-mono text-[11px] text-slate-500">{customerPhone}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => handleAccept(booking._id)}
                    disabled={isActing || secondsRemaining === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {isActing ? "Accepting..." : "Accept Job"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDecline(booking._id)}
                    disabled={isActing}
                    className="px-3 text-xs h-9 rounded-xl text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
