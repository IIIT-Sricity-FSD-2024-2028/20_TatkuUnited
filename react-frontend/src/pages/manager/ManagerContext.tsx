import React, { createContext, useContext, useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { getMe } from "@/services/users.service";
import { getManagerByUser } from "@/services/managers.service";
import { getRegionsByManager } from "@/services/regions.service";
import {
  getProvidersByRegion,
  getProviderById,
} from "@/services/providers.service";
import { getBookingsByRegion } from "@/services/bookings.service";
import { getServices } from "@/services/services.service";
import { getCategories } from "@/services/categories.service";
import { toast } from "@/components/ui/toast";
import type {
  BookingDocument,
  CategoryDocument,
  ManagerDocument,
  ProviderDocument,
  RegionDocument,
  ServiceDocument,
  UserDocument,
} from "@/models/api.models";

export type ProviderStatus = "pending" | "approved" | "suspended";
export type BookingStatus =
  | "pending"
  | "awaiting_provider"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RegionProvider = Omit<ProviderDocument, "status"> & {
  status: ProviderStatus;
  rating?: number;
  ratingCount?: number;
};

export type RegionBooking = Omit<BookingDocument, "status"> & {
  status: BookingStatus;
};

export interface ManagerContextType {
  managerInfo: ManagerDocument | null;
  userInfo: UserDocument | null;
  regions: RegionDocument[];
  selectedRegionId: string | null;
  providers: RegionProvider[];
  bookings: RegionBooking[];
  services: ServiceDocument[];
  categories: CategoryDocument[];
  pending: number;
  loading: boolean;
  error: string | null;
  selectRegion: (regionId: string) => void;
  userUpdated: (user: UserDocument) => void;
  providerStatusChanged: (payload: { id: string; status: ProviderStatus }) => void;
  refetch: () => void;
}

export function getProviderCategoryNames(
  provider: RegionProvider,
  services: ServiceDocument[],
  categories: CategoryDocument[],
): string[] {
  const names = new Set<string>();
  for (const id of provider.offeredServices) {
    const category = services.find((s) => s._id === id)?.category;
    if (!category) continue;
    const name =
      typeof category === "string"
        ? categories.find((c) => c._id === category)?.name
        : category.name;
    if (name) names.add(name);
  }
  return [...names];
}

const ManagerContext = createContext<ManagerContextType | null>(null);

export function ManagerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const managerId = user?.id;

  const [managerInfo, setManagerInfo] = useState<ManagerDocument | null>(null);
  const [userInfo, setUserInfo] = useState<UserDocument | null>(null);
  const [regions, setRegions] = useState<RegionDocument[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [providers, setProviders] = useState<RegionProvider[]>([]);
  const [bookings, setBookings] = useState<RegionBooking[]>([]);
  const [services, setServices] = useState<ServiceDocument[]>([]);
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const refetch = () => setReloadTrigger((prev) => prev + 1);

  // Fetch me and manager & regions when managerId changes
  useEffect(() => {
    if (!managerId) return;

    let isMounted = true;
    setPending((p) => p + 1);
    getMe()
      .then((me) => {
        if (isMounted) setUserInfo(me);
      })
      .catch(() => {
        if (isMounted) setError("Fetching your profile failed");
      })
      .finally(() => {
        if (isMounted) setPending((p) => Math.max(0, p - 1));
      });

    setPending((p) => p + 1);
    getManagerByUser(managerId)
      .then(async (mgr) => {
        if (!mgr) throw new Error("No manager profile found for this account");
        if (isMounted) setManagerInfo(mgr);
        const regList = await getRegionsByManager(mgr._id);
        if (isMounted) {
          setRegions(regList);
          setSelectedRegionId((prev) => {
            if (prev && regList.some((r) => r._id === prev)) return prev;
            return regList[0]?._id ?? null;
          });
        }
      })
      .catch((err) => {
        if (isMounted)
          setError(err?.message || "Fetching manager details failed");
      })
      .finally(() => {
        if (isMounted) setPending((p) => Math.max(0, p - 1));
      });

    return () => {
      isMounted = false;
    };
  }, [managerId, reloadTrigger]);

  // Fetch services and categories catalogue
  useEffect(() => {
    let isMounted = true;
    setPending((p) => p + 1);
    Promise.all([
      getServices(),
      getCategories().catch(() => [] as CategoryDocument[]),
    ])
      .then(([srvList, catList]) => {
        if (isMounted) {
          setServices(srvList);
          setCategories(catList);
        }
      })
      .catch(() => {
        if (isMounted) setError("Fetching services failed");
      })
      .finally(() => {
        if (isMounted) setPending((p) => Math.max(0, p - 1));
      });

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Fetch region providers and bookings when selectedRegionId changes
  useEffect(() => {
    if (!selectedRegionId) {
      setProviders([]);
      setBookings([]);
      return;
    }

    let isMounted = true;
    setPending((p) => p + 2);

    getProvidersByRegion(selectedRegionId)
      .then(async (list) => {
        const enriched = await Promise.all(
          (list as unknown as RegionProvider[]).map(async (p) => {
            try {
              return (await getProviderById(p._id)) as unknown as RegionProvider;
            } catch {
              return p;
            }
          }),
        );
        if (isMounted) setProviders(enriched);
      })
      .catch(() => {
        if (isMounted) setError("Fetching service providers failed");
      })
      .finally(() => {
        if (isMounted) setPending((p) => Math.max(0, p - 1));
      });

    getBookingsByRegion(selectedRegionId)
      .then((bkList) => {
        if (isMounted) setBookings(bkList as unknown as RegionBooking[]);
      })
      .catch(() => {
        if (isMounted) setError("Fetching bookings failed");
      })
      .finally(() => {
        if (isMounted) setPending((p) => Math.max(0, p - 1));
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegionId, reloadTrigger]);

  // Toast for error notifications
  useEffect(() => {
    if (error) {
      toast.add({ type: "error", description: error, priority: "high" });
    }
  }, [error]);

  const selectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    setProviders([]);
    setBookings([]);
  };

  const userUpdated = (updatedUser: UserDocument) => {
    setUserInfo(updatedUser);
  };

  const providerStatusChanged = ({
    id,
    status,
  }: {
    id: string;
    status: ProviderStatus;
  }) => {
    setProviders((prev) =>
      prev.map((p) => (p._id === id ? { ...p, status } : p)),
    );
  };

  return (
    <ManagerContext.Provider
      value={{
        managerInfo,
        userInfo,
        regions,
        selectedRegionId,
        providers,
        bookings,
        services,
        categories,
        pending,
        loading: pending > 0,
        error,
        selectRegion,
        userUpdated,
        providerStatusChanged,
        refetch,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager(): ManagerContextType {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error("useManager must be used within a ManagerProvider");
  }
  return context;
}

export default ManagerContext;
