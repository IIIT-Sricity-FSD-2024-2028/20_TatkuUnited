import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/general/LandingPage";
import Register from "./pages/general/RegisterPage";
import Login from "./pages/general/LoginPage";

import Provider from "./pages/general/Provider";
import SuperUser from "./pages/superuser/superuser_route";
import ManagerRouter from "./pages/manager/manager_route";

import Cart from "./pages/CartPage";
import Schedule from "./pages/SchedulePage";
import AccountSettings from "./pages/AccountSettingsPage";
import RatingsFeedback from "./pages/RatingsFeedbackPage";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";

function App() {
    return (
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

                    <Route path="/cart" element={<Cart />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/account-settings" element={<AccountSettings />} />
                    <Route path="/ratings-feedback" element={<RatingsFeedback />} />

                    <Route path="*" element={<div>404! Page Not Found.</div>} />
                </Routes>
            </BrowserRouter>
        </ReduxProvider>
    );
}

export default App;