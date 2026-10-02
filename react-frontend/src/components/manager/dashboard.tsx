import { useSelector } from "react-redux";
import type { RootState } from "../../store";

export default function ManagerDashboard() {
  const manager = useSelector((state: RootState) => state.manager.managerInfo);
  const collective = useSelector(
    (state: RootState) => state.manager.collectiveInfo,
  );

  return (
    <div className="p-2">
      <h1 className="font-semibold text-2xl mb-4">
        Welcome back, {manager?.name ?? "Guest"}
      </h1>
      <div className="grid gap-4 grid-cols-2 grid-rows-2">
        <div className="bg-white border border-gray-500 rounded p-4">
          <p className="text-md font-semibold">Region Name</p>
          <h2>{collective?.collective_name ?? "Unknown collective"}</h2>
        </div>
        <div className="bg-white border border-gray-500 rounded p-4">
          <p className="text-md font-semibold">Total Providers</p>
          <h2>{"total providers"}</h2>
        </div>
        <div className="bg-white border border-gray-500 rounded p-4">
          <p className="text-md font-semibold">Revenue (All time)</p>
          <h2>{"total revenue"}</h2>
        </div>
        <div className="bg-white border border-gray-500 rounded p-4">
          <p className="text-md font-semibold">Completed Services</p>
          <h2>{"total services completed"}</h2>
        </div>
      </div>
    </div>
  );
}
