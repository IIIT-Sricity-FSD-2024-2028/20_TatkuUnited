import { Route, Routes } from "react-router-dom";
import ManagerLayout from "./manager_layout";
import ManagerDashboard from "./dashboard";
import ManagerProfile from "./my-profile";
import ManagerRevenue from "./revenue";
import ManagerManageProviders from "./manage-providers";
import ProtectedRoute from "../components/protectedRoute";
import { RolesEnum } from "@/common/roles.enum";

export default function ManagerRouter() {
  return (
    <ProtectedRoute allowedRoles={[RolesEnum.MANAGER]}>
      <Routes>
        <Route element={<ManagerLayout />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="revenue" element={<ManagerRevenue />} />
          <Route path="providers" element={<ManagerManageProviders />} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
