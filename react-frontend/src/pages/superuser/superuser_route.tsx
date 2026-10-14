import { Routes, Route, Navigate } from "react-router-dom";
import { SuperUser_Layout } from "./superuser_layout"; 
import SuperUser_Dashboard from "./dashboard";
import SuperUser_ManageUsers from "./manage_users";
import SuperUser_ManageServices from "./manage_services";
import SuperUser_ManageCategories from "./manage_categories";
import SuperUser_ManageRegions from "./manage_regions";
// import the new page here

export default function SuperUser()
{
    return(
        <Routes>
            <Route path="/" element={<SuperUser_Layout />}>
                <Route index element={<Navigate to="dashboard" replace />} />

                <Route path="dashboard" element={<SuperUser_Dashboard />} />
                <Route path="manage_users" element={<SuperUser_ManageUsers />} />
                <Route path="manage_categories" element={<SuperUser_ManageCategories />} />
                <Route path="manage_services" element={<SuperUser_ManageServices />} />
                <Route path="manage_regions" element={<SuperUser_ManageRegions />} />
                {/* contue the pattern followed by the above line for the other pages.
                Now add some lines in superuser sidebar */}
            </Route>
        </Routes>
    )
}