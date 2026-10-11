import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ManagerDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { regions, selectedRegionId, providers, bookings } = useSelector(
    (state: RootState) => state.manager,
  );
  const region = regions.find((r) => r._id === selectedRegionId);

  const approved = providers.filter((p) => p.status === "approved").length;
  const awaitingApproval = providers.filter(
    (p) => p.status === "pending",
  ).length;
  const completed = bookings.filter((b) => b.status === "completed");
  const revenue = completed.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="p-2">
      <h1 className="font-semibold text-2xl mb-4">
        Welcome back, {user?.name ?? "Guest"}
      </h1>
      <div className="grid gap-4 grid-cols-2 grid-rows-2">
        <Card>
          <CardHeader>
            <CardTitle>Region Name</CardTitle>
          </CardHeader>
          <CardContent>
            {region?.name ?? "No region assigned"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {approved}
            {awaitingApproval > 0 && (
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
          <CardContent>{formatRupees(revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Services</CardTitle>
          </CardHeader>
          <CardContent>{completed.length}</CardContent>
        </Card>
      </div>
    </div>
  );
}
