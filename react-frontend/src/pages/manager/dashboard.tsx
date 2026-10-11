import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { regions, selectedRegionId } = useSelector(
    (state: RootState) => state.manager,
  );
  const region = regions.find((r) => r._id === selectedRegionId);

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
          <CardContent>{"total providers"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue (All time)</CardTitle>
          </CardHeader>
          <CardContent>{"total revenue"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Services</CardTitle>
          </CardHeader>
          <CardContent>{"total services completed"}</CardContent>
        </Card>
      </div>
    </div>
  );
}
