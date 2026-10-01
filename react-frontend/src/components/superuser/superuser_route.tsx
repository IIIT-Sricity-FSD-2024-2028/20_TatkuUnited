import { Routes, Route } from "react-router-dom";
import { SuperUser_Layout } from "./superuser_layout"
import SuperUser_Dashboard from "./dashboard";
import SuperUser_ManageUsers from "./manage_users";
// import the new page here

export default function SuperUser()
{
    return(
        <Routes>
            <Route path="/" element={<SuperUser_Layout />}>
                <Route index element={<SuperUser_Dashboard />} />

                <Route path="dashboard" element={<SuperUser_Dashboard />} />
                <Route path="manage_users" element={<SuperUser_ManageUsers />} />
                {/* contue the pattern followed by the above line for the other pages.
                Now add some lines in superuser sidebar */}
            </Route>
        </Routes>
    )
}