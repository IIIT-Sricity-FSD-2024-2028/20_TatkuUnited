import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import {
  acceptBookingThunk,
  providerActions,
  rejectBookingThunk,
} from "@/store/provider/provider-slice";
import type { BookingDocument, ServiceDocument, UserDocument } from "@/models/api.models";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

// Global module-level set so offers aren't double-toasted across components
export const notifiedOfferIds = new Set<string>();
let notificationScope: string | null = null;

function resetNotificationsForUser(userId?: string) {
  if (notificationScope !== (userId ?? null)) {
    notifiedOfferIds.clear();
    notificationScope = userId ?? null;
  }
}

function formatSlotTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${ampm}`;
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

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

export function useIncomingOfferNotifier(onOfferAccepted?: (booking: BookingDocument) => void) {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const providerIdRef = useRef<string | null>(null);
  const { profile, offers } = useSelector((s: RootState) => s.provider);

  // 1. Resolve Provider ID once
  useEffect(() => {
    providerIdRef.current = profile?._id ?? null;
  }, [profile]);

  useEffect(() => {
    resetNotificationsForUser(user?.id);
  }, [user?.id]);

  const handleAccept = useCallback(
    async (bookingId: string, toastId: string) => {
      try {
        const accepted = await dispatch(
          acceptBookingThunk({ id: bookingId, providerId: providerIdRef.current ?? undefined }),
        ).unwrap();
        toast.add({
          type: "success",
          title: "🎉 Job Accepted!",
          description: "Booking confirmed and added to your assigned schedule.",
          priority: "high",
        });
        toast.close(toastId);
        onOfferAccepted?.(accepted);
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
          dispatch(providerActions.offerRemoved(bookingId));
        } else {
          toast.add({
            type: "error",
            title: "Accept Failed",
            description: Array.isArray(msg) ? msg.join(", ") : String(msg),
          });
        }
        toast.close(toastId);
      }
    },
    [dispatch, onOfferAccepted],
  );

  const handleDecline = useCallback(async (bookingId: string, toastId: string) => {
    try {
      await dispatch(
        rejectBookingThunk({ id: bookingId, providerId: providerIdRef.current ?? undefined }),
      ).unwrap();
      toast.add({
        type: "info",
        title: "Offer Declined",
        description: "The job offer was declined and will be reassigned.",
      });
      toast.close(toastId);
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
      toast.close(toastId);
    }
  }, [dispatch]);

  const checkOffers = useCallback(() => {
    if (!user || user.role !== RolesEnum.PROVIDER) return;

    const activeOffers = offers.filter((b) => {
      const myOffer = b.offers?.find(
        (o) =>
          (!providerIdRef.current || String(o.provider) === String(providerIdRef.current)) &&
          o.status === "offered",
      );
      if (myOffer?.expiresAt) {
        return new Date(myOffer.expiresAt).getTime() > Date.now();
      }
      if (b.offerExpiresAt) {
        return new Date(b.offerExpiresAt).getTime() > Date.now();
      }
      return b.status === "awaiting_provider";
    });

    let hasNew = false;
    for (const booking of activeOffers) {
      if (!notifiedOfferIds.has(booking._id)) {
        notifiedOfferIds.add(booking._id);
        hasNew = true;

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

        // Dispatch toast with inline Accept & Decline buttons
        toast.add({
          type: "info",
          title: `⚡ New Job Offer: ${serviceName}`,
          description: `${customerName} • ${timeSlot} • Payout: ₹${payout}`,
          priority: "high",
          timeout: 60000,
          actions: ({ id }: { id: string }) => (
            <div className="flex items-center gap-2 mt-1">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-7 px-3 cursor-pointer shadow-xs"
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

    if (hasNew) {
      playChime();
    }
  }, [user, handleAccept, handleDecline, offers]);

  useEffect(() => {
    checkOffers();
  }, [checkOffers]);
}
