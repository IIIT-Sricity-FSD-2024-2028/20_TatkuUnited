import { Outlet } from "react-router-dom";
import {
  BsCalendar3,
  BsCash,
  BsGrid,
  BsListTask,
  BsGear,
  BsLightningCharge,
  BsPerson,
} from "react-icons/bs";
import SideBar, { SidebarItem } from "../shared/Sidebar";
import UserHeader from "../shared/user-header";
import UrlMap from "../../common/urlMap";
import { useIncomingOfferNotifier } from "./useIncomingOfferNotifier";

export default function ProviderLayout() {
  // Real-time listener for incoming offers with interactive toast alerts (Accept / Decline)
  useIncomingOfferNotifier();

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar>
        <SidebarItem
          icon={<BsGrid />}
          label="Dashboard"
          to={`${UrlMap.provider}/dashboard`}
        />
        <SidebarItem
          icon={<BsLightningCharge />}
          label="Incoming Offers"
          to={`${UrlMap.provider}/offers`}
        />
        <SidebarItem
          icon={<BsListTask />}
          label="Assigned Jobs"
          to={`${UrlMap.provider}/assigned-jobs`}
        />
        <SidebarItem
          icon={<BsCalendar3 />}
          label="Calendar"
          to={`${UrlMap.provider}/calendar`}
        />
        <SidebarItem
          icon={<BsCash />}
          label="Earnings"
          to={`${UrlMap.provider}/earnings`}
        />
        <SidebarItem
          icon={<BsGear />}
          label="Settings"
          to={`${UrlMap.provider}/settings`}
        />
        <SidebarItem
          icon={<BsPerson />}
          label="Profile"
          to={`${UrlMap.provider}/profile`}
        />
      </SideBar>

      <div className="flex w-full flex-1 flex-col">
        <UserHeader header="Provider Dashboard" />
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
