import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import { fetchProviderByUser } from "@/store/provider/provider-slice";
import IncomingOffers from "./IncomingOffers";
import AssignedJobs from "./AssignedJobs";
import { Star, ShieldCheck, UserCheck } from "lucide-react";
import { useProviderData } from "./ProviderDataContext";

export default function Dashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const { profile: provider, pending, error } = useSelector((s: RootState) => s.provider);

  useEffect(() => {
    if (isProvider && user?.id) {
      void dispatch(fetchProviderByUser(user.id));
    }
  }, [dispatch, isProvider, user?.id]);

  const isLoading = pending > 0 && !provider;
  const isError = Boolean(error) && !provider;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-white border border-slate-200" />
        <div className="h-64 rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Provider access required to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {providerError && (
        <p className="rounded-lg border border-destructive p-4 text-sm" role="alert">
          Unable to load provider details.
        </p>
      )}
      {/* Provider Quick Profile Bar */}
      {provider && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    {user?.name || "Service Professional"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 capitalize">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {provider.status || "Approved"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Experience: {provider.experience} years • Working Hours:{" "}
                  {Math.floor(provider.workHourStart / 60)}:00 - {Math.floor(provider.workHourEnd / 60)}:00
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  Customer Rating
                </span>
                <div className="flex items-center gap-1 text-base font-extrabold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>
                    {typeof provider.rating === "number" ? provider.rating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({provider.ratingCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Real-time Incoming Job Offers */}
      <IncomingOffers providerId={provider?._id} />

      {/* 2. Assigned / Confirmed Jobs */}
      <div className="space-y-3">
        <AssignedJobs />
      </div>
    </div>
  );
}
