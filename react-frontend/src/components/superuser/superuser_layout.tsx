import { Outlet } from 'react-router-dom'
import SuperUser_SideBar from "./superuser_sidebar";
import SuperUser_Header from "./superuser_header";

export const SuperUser_Layout = () => {
    return(
        <div className='flex h-screen overflow-hidden'>
            <SuperUser_SideBar />
            <div className='flex flex-col flex-1 w-full'>
                <SuperUser_Header />
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}