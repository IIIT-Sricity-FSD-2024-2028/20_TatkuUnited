// To use this shared sidebar-
// create a layout for the role (if it doesnt exist yet)
// create the route for the pages. example usage- superuser_route

import { NavLink } from 'react-router-dom'
import { type ReactNode } from 'react';

interface SideBarItemProps
{
    to: string;
    label: string;
}

export default function SideBar({ children }: { children: ReactNode})
{
    return(
        <aside className="w-64 h-full bg-white border-r">
            <div className="h-20 flex items-center px-6 gap-3 border-b border-gray-100">
                
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold tracking-wider">
                    TU
                </div>
                
                <span className="font-bold text-gray-900 text-lg tracking-tight">
                    Tatku United
                </span>

            </div>

            <nav className="flex flex-col gap-2 p-4">
                { children }
            </nav>
        </aside>
    )
}

export const SidebarItem = ({to, label}: SideBarItemProps) => {
    return(
        <NavLink
            to={to}
            className={({isActive}) =>  
                `block p-3 rounded-lg transition-colors font-medium ${
                 isActive 
                    ? "bg-blue-50 text-blue-700" // The style when this page is open
                    : "text-gray-600 hover:bg-gray-100" // The style when it is NOT open
                }`
            }
        >
            {label}
        </NavLink>
    );
};