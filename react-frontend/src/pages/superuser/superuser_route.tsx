import { Routes, Route } from "react-router-dom";
import { SuperUser_Layout } from "./superuser_layout";
import SuperUser_Dashboard from "./dashboard";
import SuperUser_ManageUsers from "./manage_users";
import ProtectedRoute from "../components/protectedRoute";
import { RolesEnum } from "@/common/roles.enum";
// import the new page here

export default function SuperUser() {
  return (
    <ProtectedRoute allowedRoles={[RolesEnum.ADMIN]}>
      <Routes>
        <Route element={<SuperUser_Layout />}>
          <Route index element={<SuperUser_Dashboard />} />

          <Route path="dashboard" element={<SuperUser_Dashboard />} />
          <Route path="manage_users" element={<SuperUser_ManageUsers />} />
          {/* continue the pattern followed by the above line for the other pages.
                Now add some lines in superuser sidebar */}
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
