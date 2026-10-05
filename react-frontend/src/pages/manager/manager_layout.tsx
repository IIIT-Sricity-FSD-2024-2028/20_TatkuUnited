import SideBar, { SidebarItem } from "../shared/Sidebar";
import { BsCash, BsGrid, BsPeople, BsPersonAdd } from "react-icons/bs";
import { Outlet } from "react-router-dom";
import UserHeader from "../shared/user-header";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useEffect } from "react";
import {
  fetchCollective,
  fetchManager,
} from "../../store/manager/manager-slice";
import UrlMap from "../../common/urlMap";

export default function ManagerLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const manager = useSelector((state: RootState) => state.auth.user);
  const managerId = manager.id;

  useEffect(() => {
    dispatch(fetchManager(managerId));
    dispatch(fetchCollective(managerId));
  }, [dispatch]);

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
        <UserHeader header="Manager Dashboard" />
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
