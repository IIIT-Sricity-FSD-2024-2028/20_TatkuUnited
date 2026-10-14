import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/general/landing/LandingPage";
import Register from "./pages/general/RegisterPage";
import Login from "./pages/general/LoginPage";

import Provider from "./pages/general/Provider";
import SuperUser from "./pages/superuser/superuser_route";
import ManagerRouter from "./pages/manager/manager_route";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import AuthContext from "./common/AuthContext";
import { useState } from "react";
import type { AuthInterface } from "./models/auth.models";
import { Toaster } from "./components/ui/toast";
import NotFound from "./pages/components/notFound";
import CustomerRouter from "./pages/customer/customer_route";
import ServiceCatalog from "./pages/general/serviceCatalog";
import ServicePage from "./pages/general/servicePage";
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

            <Route path="/services" element={<ServiceCatalog />} />
            <Route path="/services/:serviceId" element={<ServicePage />} />

            <Route path="/provider/*" element={<Provider />} />

            <Route path="/superuser/*" element={<SuperUser />} />
            <Route path="/manager/*" element={<ManagerRouter />} />
            <Route path="/customer/*" element={<CustomerRouter />} />

            {/* Backwards-compatible route redirects
            <Route path="/cart" element={<Navigate to="/customer/cart" replace />} />
            <Route path="/schedule" element={<Navigate to="/customer/schedule" replace />} />
            <Route path="/account-settings" element={<Navigate to="/customer/account-settings" replace />} />
            <Route path="/ratings-feedback" element={<Navigate to="/customer/ratings-feedback" replace />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ReduxProvider>
    </AuthContext.Provider>
  );
}

export default App;
