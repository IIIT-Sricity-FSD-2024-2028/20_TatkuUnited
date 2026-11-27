import { useState } from "react";
import { BsStarFill } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import {
  changeProviderStatus,
  getProviderCategoryNames,
  updateProviderServices,
  type ProviderStatus,
  type RegionProvider,
} from "../../store/manager/manager-slice";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "../../components/ui/toast";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const STATUS_STYLES: Record<ProviderStatus, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
};

type StatusFilter = "all" | ProviderStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
];

type ProviderAction = "approve" | "suspend";

export default function ManagerManageProviders() {
  const dispatch = useDispatch<AppDispatch>();
  const { providers, services, categories, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  // the provider and action waiting for the manager's confirmation
  const [confirming, setConfirming] = useState<{
    id: string;
    name: string;
    action: ProviderAction;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingProvider, setEditingProvider] = useState<RegionProvider | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  // only this page cares about the filter, so it stays local, not in Redux
  const [filter, setFilter] = useState<StatusFilter>("all");
  const loading = pending > 0;

  const openEditServices = (p: RegionProvider) => {
    const initialIds = (p.offeredServices || []).map((s) =>
      typeof s === "string" ? s : s._id,
    );
    setSelectedServiceIds(initialIds);
    setEditingProvider(p);
  };

  const toggleServiceId = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSaveServices = async (approve: boolean) => {
    if (!editingProvider) return;
    setSavingServices(true);
    const providerUser =
      typeof editingProvider.user === "string" ? null : editingProvider.user;
    const providerName = providerUser?.name ?? "Provider";
    try {
      await dispatch(
        updateProviderServices({
          id: editingProvider._id,
          offeredServices: selectedServiceIds,
          approve,
        }),
      ).unwrap();
      toast.add({
        type: "info",
        description: approve
          ? `${providerName} services updated and approved`
          : `${providerName} services updated`,
      });
      setEditingProvider(null);
    } catch {
      toast.add({
        type: "error",
        description: `Could not update services for ${providerName}`,
        priority: "high",
      });
    } finally {
      setSavingServices(false);
    }
  };

  const activeServices = services.filter((s) => s.isActive !== false);
  const servicesByCategory = categories
    .map((cat) => ({
      category: cat,
      items: activeServices.filter((s) => {
        const catId = typeof s.category === "string" ? s.category : s.category?._id;
        return catId === cat._id;
      }),
    }))
    .filter((group) => group.items.length > 0);
  const uncategorizedServices = activeServices.filter((s) => {
    const catId = typeof s.category === "string" ? s.category : s.category?._id;
    return !catId || !categories.some((c) => c._id === catId);
  });

  const active = providers.filter((p) => p.status === "approved");
  // providers nobody has rated yet shouldn't pull the average down
  const rated = active.filter((p) => (p.ratingCount ?? 0) > 0);
  const averageRating = rated.length
    ? (rated.reduce((sum, p) => sum + (p.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  const visible =
    filter === "all" ? providers : providers.filter((p) => p.status === filter);
  const countOf = (f: StatusFilter) =>
    f === "all" ? providers.length : providers.filter((p) => p.status === f).length;

  const confirmAction = async () => {
    if (!confirming) return;
    const { id, name, action } = confirming;
    setSaving(true);
    try {
      await dispatch(changeProviderStatus({ id, action })).unwrap();
      toast.add({
        type: "info",
        description: `${name} ${action === "approve" ? "approved" : "suspended"}`,
      });
      setConfirming(null);
    } catch {
      toast.add({
        type: "error",
        description: `Could not ${action} ${name}`,
        priority: "high",
      });
    } finally {
      setSaving(false);
    }
  };

  const stat = (value: string | number) =>
    loading ? <Skeleton className="h-6 w-16" /> : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Providers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage and monitor your service providers
        </p>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Provider Pulse</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Card className="w-full max-w-sm">
            <CardContent>
              <div>{stat(active.length)}</div>
              Active
            </CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardContent>
              <div>{stat(averageRating)}</div>
              Average Rating
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? "default" : "outline"}
                onClick={() => setFilter(f.value)}
              >
                {f.label} ({loading ? "…" : countOf(f.value)})
              </Button>
            ))}
          </div>
          {loading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!loading && visible.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {providers.length === 0
                ? "No service providers in this region yet."
                : `No ${filter} providers.`}
            </p>
          )}
          {!loading &&
            visible.map((p) => {
              const user = typeof p.user === "string" ? null : p.user;
              const categoryNames = getProviderCategoryNames(
                p,
                services,
                categories,
              );
              return (
                <Card key={p._id} className="w-full">
                  <CardHeader>
                    <CardTitle>{user?.name ?? "Unknown provider"}</CardTitle>
                    <CardDescription>
                      {categoryNames.length
                        ? categoryNames.join(", ")
                        : "No category"}
                    </CardDescription>
                    <CardAction className="flex items-center gap-1">
                      <BsStarFill className="text-yellow-500 text-xl" />
                      <div className="flex flex-col items-start">
                        <p>
                          {(p.ratingCount ?? 0) > 0
                            ? (p.rating ?? 0).toFixed(1)
                            : "No ratings"}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLES[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3"
                        onClick={() => openEditServices(p)}
                      >
                        Edit Services ({p.offeredServices?.length ?? 0})
                      </Button>
                      <Button
                        size="sm"
                        variant={p.status === "approved" ? "outline" : "default"}
                        className="ml-2"
                        onClick={() =>
                          setConfirming({
                            id: p._id,
                            name: user?.name ?? "this provider",
                            action: p.status === "approved" ? "suspend" : "approve",
                          })
                        }
                      >
                        {p.status === "approved"
                          ? "Suspend"
                          : p.status === "suspended"
                            ? "Reinstate"
                            : "Approve"}
                      </Button>
                    </CardAction>
                  </CardHeader>
                </Card>
              );
            })}
        </CardContent>
      </Card>
      <Dialog
        open={confirming !== null}
        onOpenChange={(open: boolean) => !open && !saving && setConfirming(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirming?.action === "approve" ? "Approve" : "Suspend"} provider?
            </DialogTitle>
            <DialogDescription>
              {confirming?.action === "approve"
                ? `${confirming?.name} will be able to receive job offers.`
                : `${confirming?.name} will stop receiving new job offers.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={confirmAction}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingProvider !== null}
        onOpenChange={(open: boolean) => !open && !savingServices && setEditingProvider(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Services —{" "}
              {editingProvider && typeof editingProvider.user !== "string"
                ? editingProvider.user?.name
                : "Provider"}
            </DialogTitle>
            <DialogDescription>
              Select the services this provider is qualified to offer in your region.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {servicesByCategory.map(({ category, items }) => (
              <div key={category._id} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {category.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((svc) => {
                    const checked = selectedServiceIds.includes(svc._id);
                    return (
                      <label
                        key={svc._id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                          checked
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleServiceId(svc._id)}
                          className="rounded border-slate-300"
                        />
                        <span className="truncate">{svc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {uncategorizedServices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Other Services
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uncategorizedServices.map((svc) => {
                    const checked = selectedServiceIds.includes(svc._id);
                    return (
                      <label
                        key={svc._id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                          checked
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleServiceId(svc._id)}
                          className="rounded border-slate-300"
                        />
                        <span className="truncate">{svc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {activeServices.length === 0 && (
              <p className="text-sm text-slate-500">No active services available.</p>
            )}
          </div>

          <DialogFooter className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={savingServices}
              onClick={() => setEditingProvider(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={savingServices}
              onClick={() => void handleSaveServices(false)}
            >
              {savingServices ? "Saving…" : "Save Services"}
            </Button>
            {editingProvider && editingProvider.status !== "approved" && (
              <Button
                disabled={savingServices}
                onClick={() => void handleSaveServices(true)}
              >
                {savingServices ? "Saving…" : "Save & Approve"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
