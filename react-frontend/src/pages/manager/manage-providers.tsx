import { useState } from "react";
import { BsStarFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  getProviderCategoryNames,
  type ProviderStatus,
} from "../../store/manager/manager-slice";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
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

export default function ManagerManageProviders() {
  // only this page cares about the filter, so it stays local, not in Redux
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { providers, services, categories, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  const loading = pending > 0;

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

  const stat = (value: string | number) =>
    loading ? <Skeleton className="h-6 w-16" /> : value;

  return (
    <div>
      <div>
        <h1>Service Providers</h1>
        <p>Manage and monitor your service providers</p>
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
                    </CardAction>
                  </CardHeader>
                </Card>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
