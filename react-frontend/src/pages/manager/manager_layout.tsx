import SideBar, { SidebarItem } from "../shared/Sidebar";
import {
  BsBoxArrowRight,
  BsCash,
  BsGrid,
  BsPeople,
  BsPersonAdd,
} from "react-icons/bs";
import { Outlet } from "react-router-dom";
import UserHeader from "../shared/user-header";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useContext, useEffect } from "react";
import AuthContext from "@/common/AuthContext";
import { handleLogout } from "@/common/services/authService";
import { Button } from "@/components/ui/button";
import {
  ManagerActions,
  fetchCatalogue,
  fetchManager,
  fetchMe,
  fetchRegionBookings,
  fetchRegionProviders,
  fetchRegions,
} from "../../store/manager/manager-slice";
import UrlMap from "../../common/urlMap";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

export default function ManagerLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const auth = useContext(AuthContext);
  const managerId = user?.id;
  const { regions, selectedRegionId, error } = useSelector(
    (state: RootState) => state.manager,
  );

  // Same as the public navbar: clear the stored session, then clear the
  // context. ProtectedRoute then sees the user is gone and goes to /auth/login.
  const onLogout = () => {
    handleLogout();
    // the context type doesn't allow null yet, though App starts it as null
    auth?.setAuthDetails(null as never);
  };

  useEffect(() => {
    if (!managerId) return;
    dispatch(fetchMe());
    dispatch(fetchManager(managerId))
      .unwrap()
      .then((m) => dispatch(fetchRegions(m._id)))
      .catch(() => {}); // the failure is already stored as state.manager.error
  }, [dispatch, managerId]);

  useEffect(() => {
    dispatch(fetchCatalogue());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.add({ type: "error", description: error, priority: "high" });
  }, [error]);

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
          <div className="flex items-center gap-3">
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
            <Button variant="outline" size="sm" onClick={onLogout}>
              <BsBoxArrowRight className="mr-1" />
              Logout
            </Button>
          </div>
        </div>
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
