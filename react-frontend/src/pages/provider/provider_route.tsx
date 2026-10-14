import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/protectedRoute";
import { RolesEnum } from "@/common/roles.enum";
import AssignedJobs from "./AssignedJobs";
import JobCalender from "./JobCalender";
import Revenue from "./Revenue";
import Settings from "./Settings";
import ProviderLayout from "./provider_layout";

export default function ProviderRouter() {
  return (
    <ProtectedRoute allowedRoles={[RolesEnum.PROVIDER]}>
      <Routes>
        <Route element={<ProviderLayout />}>
          <Route index element={<AssignedJobs />} />
          <Route path="dashboard" element={<AssignedJobs />} />
          <Route path="assigned-jobs" element={<AssignedJobs />} />
          <Route path="calendar" element={<JobCalender />} />
          <Route path="earnings" element={<Revenue />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
