import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerDashboard() {
  const manager = useSelector((state: RootState) => state.manager.managerInfo);
  const collective = useSelector(
    (state: RootState) => state.manager.collectiveInfo,
  );
  const serviceProviders = useSelector(
    (state: RootState) => state.manager.providersInfo,
  );

  return (
    <div className="p-2">
      <h1 className="font-semibold text-2xl mb-4">
        Welcome back, {manager?.name ?? "Guest"}
      </h1>
      <div className="grid gap-4 grid-cols-2 grid-rows-2">
        <Card>
          <CardHeader>
            <CardTitle>Region Name</CardTitle>
          </CardHeader>
          <CardContent>
            {collective?.collective_name ?? "Unknown collective"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Providers</CardTitle>
          </CardHeader>
          <CardContent>{serviceProviders.length}</CardContent>
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
