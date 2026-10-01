// To use this shared sidebar-
// create a layout for the role (if it doesnt exist yet)
// create the route for the pages. example usage- superuser_route

import { NavLink } from 'react-router-dom'
import { type ReactNode, createContext, useContext, useState } from 'react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

const SidebarContext = createContext({isExpanded: true});

interface SideBarItemProps
{
    to: string;
    label: string;
    icon: ReactNode;
}

export default function SideBar({ children }: { children: ReactNode})
{
    const [ isExpanded, setIsExpanded ] = useState(true);
    
    return(
        <SidebarContext.Provider value={{isExpanded}}>
            <aside className={`h-full bg-white border-r flex flex-col transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
                <div className="h-20 flex items-center px-6 gap-3 border-b border-gray-100 overflow-hidden">
                    
                    <div className="w-10 h-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold tracking-wider">
                        TU
                    </div>
                    
                    <span className={`font-bold whitespace-nowrap text-gray-900 text-lg tracking-tight transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        Tatku United
                    </span>

                </div>
                <div className='border-t border-gray-100 p-4'>
                    <button onClick={() => setIsExpanded(!isExpanded)} className='w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'>
                        {isExpanded ? <BsChevronLeft size={20} />: <BsChevronRight size={20} />}
                    </button>
                </div>

                <nav className="flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden">
                    { children }
                </nav>

                
            </aside>
        </SidebarContext.Provider>
    )
}

export const SidebarItem = ({to, label, icon}: SideBarItemProps) => {
    
    const { isExpanded } = useContext(SidebarContext);
    
    return(
        <NavLink
            to={to}
            title={!isExpanded ? label : undefined}
            className={({isActive}) =>  
                `flex items-center gap-4 p-3 rounded-lg transition-colors font-medium ${
                 isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100" 
                }`
            }
        >

            <div className="text-xl shrink-0 flex items-center justify-center">
                {icon}
            </div>

            <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                {label}
            </span>
        </NavLink>
    );
};