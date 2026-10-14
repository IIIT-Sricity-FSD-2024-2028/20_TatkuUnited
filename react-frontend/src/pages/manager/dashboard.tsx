import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import useAuth from "@/hooks/useAuth";
import { useManager } from "./ManagerContext";

const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { regions, selectedRegionId, providers, bookings, pending, error } =
    useManager();

  const region = regions.find((r) => r._id === selectedRegionId);
  const loading = pending > 0;

  const approved = providers.filter((p) => p.status === "approved").length;
  const awaitingApproval = providers.filter(
    (p) => p.status === "pending",
  ).length;
  const completed = bookings.filter((b) => b.status === "completed");
  const revenue = completed.reduce((sum, b) => sum + b.price, 0);

  const stat = (value: string | number) =>
    loading ? <Skeleton className="h-6 w-24" /> : value;

  return (
    <div className="p-2 space-y-6">
      <div>
        <h1 className="font-semibold text-2xl text-slate-900">
          Welcome back, {user?.name ?? "Guest"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Regional performance overview for operational territory.
        </p>
      </div>
      {!loading && !error && regions.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
          No region is assigned to your account yet.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Assigned Region
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {stat(region?.name ?? "No region assigned")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {stat(approved)}
            {!loading && awaitingApproval > 0 && (
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {awaitingApproval} awaiting approval
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Completed Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {stat(completed.length)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Region Revenue (All time)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">
            {stat(formatRupees(revenue))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
