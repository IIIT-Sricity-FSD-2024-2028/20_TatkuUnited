import { Route, Routes } from "react-router-dom";
import ManagerLayout from "./manager_layout";
import ManagerDashboard from "./dashboard";
import ManagerProfile from "./my-profile";
import ManagerRevenue from "./revenue";
import ManagerManageProviders from "./manage-providers";

export default function ManagerRouter() {
  return (
    <Routes>
      <Route path="/" element={<ManagerLayout />}>
        <Route index element={<ManagerDashboard />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="revenue" element={<ManagerRevenue />} />
        <Route path="providers" element={<ManagerManageProviders />} />
        <Route path="profile" element={<ManagerProfile />} />
      </Route>
    </Routes>
  );
}
