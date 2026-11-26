import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  BsCalendar3,
  BsCash,
  BsGrid,
  BsListTask,
  BsGear,
  BsLightningCharge,
  BsPerson,
} from "react-icons/bs";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchProviderByUser,
  fetchProviderOffers,
} from "@/store/provider/provider-slice";
import SideBar, { SidebarItem } from "../shared/Sidebar";
import UserHeader from "../shared/user-header";
import UrlMap from "../../common/urlMap";
import { useIncomingOfferNotifier } from "./useIncomingOfferNotifier";

export default function ProviderLayout() {
  return <ProviderLayoutContent />;
}

function ProviderLayoutContent() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const { profile, profileStatus } = useSelector((s: RootState) => s.provider);

  const isPollingBusy = useRef(false);

  useEffect(() => {
    if (isProvider && user?.id && !profile && profileStatus === "idle") {
      void dispatch(fetchProviderByUser(user.id));
    }
  }, [dispatch, isProvider, profile, profileStatus, user?.id]);

  useEffect(() => {
    if (!isProvider || !profile?._id) return;
    const pollOffers = async () => {
      if (isPollingBusy.current) return;
      isPollingBusy.current = true;
      try {
        await dispatch(fetchProviderOffers()).unwrap();
      } catch {
        // silent fail on background polling
      } finally {
        isPollingBusy.current = false;
      }
    };

    void pollOffers();
    const interval = window.setInterval(() => {
      void pollOffers();
    }, 6000);
    return () => window.clearInterval(interval);
  }, [dispatch, isProvider, profile?._id]);

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
