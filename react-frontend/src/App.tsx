import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/general/landing/LandingPage";
import Register from "./pages/general/RegisterPage";
import Login from "./pages/general/LoginPage";

import Provider from "./pages/general/Provider";
import SuperUser from "./pages/superuser/superuser_route";
import ManagerRouter from "./pages/manager/manager_route";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

import Cart from "./pages/customer/CartPage";
import Schedule from "./pages/customer/SchedulePage";
import AccountSettings from "./pages/customer/AccountSettingsPage";
import RatingsFeedback from "./pages/customer/RatingsFeedbackPage";
import BookingHistory from "./pages/customer/BookingHistoryPage";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import AuthContext from "./common/AuthContext";
import { useState } from "react";
import type { AuthInterface } from "./models/auth.models";
import { Toaster } from "./components/ui/toast";
import NotFound from "./pages/components/notFound";
import ProtectedRoute from "./pages/components/protectedRoute";
import { RolesEnum } from "./common/roles.enum";
// import ForbiddenAccess from "./pages/components/forbiddenAccess";

function App() {
  const [authDetails, setAuthDetails] = useState<AuthInterface | null>(() => {
    try {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (token) {
        return { token, user };
      }
    } catch {
      // ignore parse errors
    }
    return null;
  });

  return (
    <AuthContext.Provider value={{ authDetails, setAuthDetails }}>
      <ReduxProvider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/auth">
              <Route path="register" element={<Register />} />
              <Route path="login" element={<Login />} />
            </Route>

            <Route path="/provider" element={<Provider />} />

            <Route path="/superuser/*" element={<SuperUser />} />
            <Route path="/manager/*" element={<ManagerRouter />} />

            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
                  <BookingHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route path="/schedule" element={<Schedule />} />
            <Route
              path="/account-settings"
              element={
                <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ratings-feedback"
              element={
                <ProtectedRoute allowedRoles={[RolesEnum.CUSTOMER]}>
                  <RatingsFeedback />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ReduxProvider>
    </AuthContext.Provider>
  );
}

export default App;
