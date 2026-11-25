import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { BookingDocument, ProviderDocument, UpdateProviderDto } from "@/models/api.models";
import { getMyPendingOffers } from "@/services/bookings.service";
import { getProviderByUser, updateProvider as saveProvider } from "@/services/providers.service";

type ProviderData = {
  provider: ProviderDocument | null;
  providerLoading: boolean;
  providerError: string | null;
  offers: BookingDocument[];
  offersLoading: boolean;
  offersError: string | null;
  refreshProvider: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  updateProvider: (changes: UpdateProviderDto) => Promise<ProviderDocument>;
};

const ProviderDataContext = createContext<ProviderData | null>(null);

function messageFor(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { message?: string | string[] } } }).response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (data?.message) return data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function activeOffers(bookings: BookingDocument[], providerId?: string) {
  return bookings.filter((booking) => {
    const offer = booking.offers?.find((item) =>
      (!providerId || String(item.provider) === String(providerId)) && item.status === "offered",
    );
    if (offer?.expiresAt) return new Date(offer.expiresAt).getTime() > Date.now();
    if (booking.offerExpiresAt) return new Date(booking.offerExpiresAt).getTime() > Date.now();
    return booking.status === "awaiting_provider";
  });
}

export function ProviderDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const [provider, setProvider] = useState<ProviderDocument | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [offers, setOffers] = useState<BookingDocument[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const providerRequest = useRef(false);
  const offerRequest = useRef(false);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const refreshProvider = useCallback(async () => {
    if (!isProvider || !user?.id || providerRequest.current) return;
    providerRequest.current = true;
    setProviderLoading(true);
    try {
      const data = await getProviderByUser(user.id);
      if (mounted.current) { setProvider(data); setProviderError(null); }
    } catch (error) {
      if (mounted.current) { setProvider(null); setProviderError(messageFor(error, "Unable to load provider details.")); }
    } finally {
      providerRequest.current = false;
      if (mounted.current) setProviderLoading(false);
    }
  }, [isProvider, user?.id]);

  useEffect(() => {
    if (!isProvider) {
      setProvider(null);
      setOffers([]);
      return;
    }
    void refreshProvider();
  }, [isProvider, refreshProvider]);

  const refreshOffers = useCallback(async () => {
    if (!isProvider || !provider?._id || offerRequest.current) return;
    offerRequest.current = true;
    setOffersLoading(true);
    try {
      const data = await getMyPendingOffers();
      if (mounted.current) { setOffers(activeOffers(data, provider._id)); setOffersError(null); }
    } catch (error) {
      if (mounted.current) setOffersError(messageFor(error, "Unable to refresh offers."));
    } finally {
      offerRequest.current = false;
      if (mounted.current) setOffersLoading(false);
    }
  }, [isProvider, provider?._id]);

  useEffect(() => {
    if (!provider?._id) return;
    void refreshOffers();
    const interval = window.setInterval(() => void refreshOffers(), 6000);
    return () => window.clearInterval(interval);
  }, [provider?._id, refreshOffers]);

  const updateProvider = useCallback(async (changes: UpdateProviderDto) => {
    if (!provider?._id) throw new Error("Provider profile is unavailable.");
    const updated = await saveProvider(provider._id, changes);
    setProvider(updated);
    return updated;
  }, [provider?._id]);

  const value = useMemo(() => ({ provider, providerLoading, providerError, offers, offersLoading, offersError, refreshProvider, refreshOffers, updateProvider }), [provider, providerLoading, providerError, offers, offersLoading, offersError, refreshProvider, refreshOffers, updateProvider]);
  return <ProviderDataContext.Provider value={value}>{children}</ProviderDataContext.Provider>;
}

export function useProviderData() {
  const value = useContext(ProviderDataContext);
  if (!value) throw new Error("useProviderData must be used within ProviderDataProvider.");
  return value;
}
