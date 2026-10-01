import { Outlet } from 'react-router-dom'
import SideBar, { SidebarItem } from "../shared/Sidebar";
import SuperUser_Header from "./superuser_header";
import { BsGrid , BsPeopleFill } from "react-icons/bs";

export const SuperUser_Layout = () => {
    return(
        <div className='flex h-screen overflow-hidden'>
            <SideBar>
                <SidebarItem to="/superuser/dashboard" label="Dashboard" icon={<BsGrid />} />
                <SidebarItem to="/superuser/manage_users" label="User Management" icon={<BsPeopleFill />} />
                {/* continue the above patter to add more pages to the sidebar */}
            </SideBar>
            <div className='flex flex-col flex-1 w-full'>
                <SuperUser_Header />
                <main className="h-full w-full overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}