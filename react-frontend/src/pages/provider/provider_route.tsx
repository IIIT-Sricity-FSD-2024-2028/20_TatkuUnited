import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/protectedRoute";
import { RolesEnum } from "@/common/roles.enum";
import Dashboard from "./Dashboard";
import IncomingOffers from "./IncomingOffers";
import AssignedJobs from "./AssignedJobs";
import JobCalender from "./JobCalender";
import Revenue from "./Revenue";
import Settings from "./Settings";
import Profile from "./Profile";
import ProviderLayout from "./provider_layout";

export default function ProviderRouter() {
  return (
    <ProtectedRoute allowedRoles={[RolesEnum.PROVIDER]}>
      <Routes>
        <Route element={<ProviderLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="offers" element={<IncomingOffers />} />
          <Route path="assigned-jobs" element={<AssignedJobs />} />
          <Route path="calendar" element={<JobCalender />} />
          <Route path="earnings" element={<Revenue />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
