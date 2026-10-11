import SideBar, { SidebarItem } from "../shared/Sidebar";
import { BsCash, BsGrid, BsPeople, BsPersonAdd } from "react-icons/bs";
import { Outlet } from "react-router-dom";
import UserHeader from "../shared/user-header";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useEffect } from "react";
import {
  ManagerActions,
  fetchManager,
  fetchRegionBookings,
  fetchRegionProviders,
  fetchRegions,
} from "../../store/manager/manager-slice";
import UrlMap from "../../common/urlMap";

export default function ManagerLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const manager = useSelector((state: RootState) => state.auth.user);
  const managerId = manager?.id;
  const { regions, selectedRegionId } = useSelector(
    (state: RootState) => state.manager,
  );

  useEffect(() => {
    if (!managerId) return;
    dispatch(fetchManager(managerId));
    dispatch(fetchRegions(managerId));
  }, [dispatch, managerId]);

  useEffect(() => {
    if (!selectedRegionId) return;
    dispatch(fetchRegionProviders(selectedRegionId));
    dispatch(fetchRegionBookings(selectedRegionId));
  }, [dispatch, selectedRegionId]);

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
              onChange={(e) =>
                dispatch(ManagerActions.selectRegion(e.target.value))
              }
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
