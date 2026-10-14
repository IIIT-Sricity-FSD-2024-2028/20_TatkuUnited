import { Routes, Route } from "react-router-dom";
import CustomerLayout from "./customer_layout";
import CustomerDashboard from "./CustomerDashboard";
import CartPage from "./CartPage";
import SchedulePage from "./SchedulePage";
import AccountSettingsPage from "./AccountSettingsPage";
import RatingsFeedbackPage from "./RatingsFeedbackPage";
import MockPaymentPage from "./MockPaymentPage";
import BookingHistoryPage from "./BookingHistoryPage";
import ProtectedRoute from "../components/protectedRoute";
import { RolesEnum } from "@/common/roles.enum";

export default function CustomerRouter() {
  return (
    <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="pay/:orderId" element={<MockPaymentPage />} />
          <Route path="bookings" element={<BookingHistoryPage />} />
          <Route path="bookings/:id" element={<BookingHistoryPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="schedule/:service_id" element={<SchedulePage />} />
          <Route path="schedule/:serviceId" element={<SchedulePage />} />
          <Route path="account-settings" element={<AccountSettingsPage />} />
          <Route path="ratings-feedback" element={<RatingsFeedbackPage />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
