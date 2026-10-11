import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ManagerDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { regions, selectedRegionId, providers, bookings, pending, error } =
    useSelector((state: RootState) => state.manager);

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
    <div className="p-2">
      <h1 className="font-semibold text-2xl mb-4">
        Welcome back, {user?.name ?? "Guest"}
      </h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {!loading && !error && regions.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
          No region is assigned to your account yet.
        </div>
      )}
      <div className="grid gap-4 grid-cols-2 grid-rows-2">
        <Card>
          <CardHeader>
            <CardTitle>Region Name</CardTitle>
          </CardHeader>
          <CardContent>{stat(region?.name ?? "No region assigned")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {stat(approved)}
            {!loading && awaitingApproval > 0 && (
              <p className="text-sm text-muted-foreground">
                {awaitingApproval} awaiting approval
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue (All time)</CardTitle>
          </CardHeader>
          <CardContent>{stat(formatRupees(revenue))}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Services</CardTitle>
          </CardHeader>
          <CardContent>{stat(completed.length)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
