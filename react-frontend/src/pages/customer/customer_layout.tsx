import { Outlet } from "react-router-dom";
import SideBar, { SidebarItem } from "../shared/Sidebar";
import CustomerHeader from "./customer_header";
import {
  BsGrid,
  BsCart3,
  BsCalendarEvent,
  BsGear,
  BsStar,
} from "react-icons/bs";

export default function CustomerLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <SideBar>
        <SidebarItem
          to="/customer/dashboard"
          label="Dashboard"
          icon={<BsGrid />}
        />
        <SidebarItem
          to="/customer/cart"
          label="My Cart"
          icon={<BsCart3 />}
        />
        <SidebarItem
          to="/customer/schedule"
          label="Schedule"
          icon={<BsCalendarEvent />}
        />
        <SidebarItem
          to="/customer/account-settings"
          label="Account Settings"
          icon={<BsGear />}
        />
        <SidebarItem
          to="/customer/ratings-feedback"
          label="Ratings & Feedback"
          icon={<BsStar />}
        />
      </SideBar>

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <CustomerHeader />
        <main className="h-full w-full overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
