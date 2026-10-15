/**
 * To add a new sidebar link:
 *   1. Import the icon you want from react-icons.
 *   2. Add a new <SidebarItem /> inside the <SideBar> component below.
 *   3. Register the corresponding route in superuser_route.tsx.
 */

import { Outlet } from 'react-router-dom'
import SideBar, { SidebarItem } from "../shared/Sidebar";
import UserHeader from "../shared/user-header.tsx";
import { BsGrid , BsPeopleFill, BsCollection, BsTools, BsHouseGearFill, BsPinMapFill, BsPersonFillCheck } from "react-icons/bs";

export const SuperUser_Layout = () => {
    return(
        <div className='flex h-screen overflow-hidden'>
            <SideBar>
                <SidebarItem to="/superuser/dashboard" label="Dashboard" icon={<BsGrid />} />
                <SidebarItem to="/superuser/manage_users" label="User Management" icon={<BsPeopleFill />} />
                <SidebarItem to="/superuser/manage_categories" label="Category Management" icon={<BsCollection />} />
                <SidebarItem to="/superuser/manage_services" label="Service Management" icon={<BsTools />} />
                <SidebarItem to="/superuser/manage_regions" label="Region Management" icon={<BsPinMapFill />} />
                <SidebarItem to="/superuser/platform_settings" label="Platform Settings" icon={<BsHouseGearFill />} />
                {/* <SidebarItem to="/superuser/profile" label="Platform Settings" icon={<BsPersonFillCheck />} /> */}
            </SideBar>
            <div className='flex flex-col flex-1 w-full'>
                <UserHeader header='Super User' />
                <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}