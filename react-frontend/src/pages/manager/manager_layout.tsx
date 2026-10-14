import SideBar, { SidebarItem } from "../shared/Sidebar";
import { BsCash, BsGrid, BsPeople, BsPersonAdd } from "react-icons/bs";
import { Outlet } from "react-router-dom";
import UserHeader from "../shared/user-header";
import UrlMap from "../../common/urlMap";
import { useManager } from "./ManagerContext";

export default function ManagerLayout() {
  const { regions, selectedRegionId, selectRegion } = useManager();

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar>
        <SidebarItem
          label="Dashboard"
          icon={<BsGrid />}
          to={`${UrlMap.manager}/dashboard`}
        ></SidebarItem>
        <SidebarItem
          label="Revenue Reports"
          icon={<BsCash />}
          to={`${UrlMap.manager}/revenue`}
        ></SidebarItem>
        <SidebarItem
          label="Manage Providers"
          icon={<BsPersonAdd />}
          to={`${UrlMap.manager}/providers`}
        ></SidebarItem>
        <SidebarItem
          label="My Profile"
          icon={<BsPeople />}
          to={`${UrlMap.manager}/profile`}
        ></SidebarItem>
      </SideBar>
      <div className="flex flex-col flex-1 w-full">
        <div className="flex items-center justify-between pr-4">
          <UserHeader header="Manager Dashboard" />
          {regions.length > 1 && (
            <select
              className="border rounded-md px-2 py-1 text-sm bg-white"
              value={selectedRegionId ?? ""}
              onChange={(e) => selectRegion(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
