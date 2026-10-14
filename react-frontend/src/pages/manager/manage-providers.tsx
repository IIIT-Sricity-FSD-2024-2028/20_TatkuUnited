import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { BsStarFill } from "react-icons/bs";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerManageProviders() {
  const serviceProviders = useSelector(
    (state: RootState) => state.manager.providersInfo,
  );
  const collective = useSelector(
    (state: RootState) => state.manager.collectiveInfo,
  );

  const activeProviders = serviceProviders.filter(
    (p) => p.status === "active" || p.is_active,
  );

  const avgRating =
    serviceProviders.length > 0
      ? (
          serviceProviders.reduce((acc, p) => acc + (p.rating || 0), 0) /
          serviceProviders.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regional Service Providers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Providers operating within {collective?.name || collective?.collective_name || "your region"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Active Providers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {activeProviders.length} / {serviceProviders.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Average Region Rating</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <span>{avgRating}</span>
            <BsStarFill className="text-xl" />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Assigned Providers</h2>

        {serviceProviders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No service providers currently registered in this region.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceProviders.map((provider) => (
              <Card key={provider._id || provider.sp_id}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {provider.phone || provider.email || "No contact info"}
                  </CardDescription>
                  <CardAction className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-sm">
                      <BsStarFill />
                      <span>{(provider.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({provider.rating_count || 0})
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        provider.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {provider.status || "Active"}
                    </span>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
