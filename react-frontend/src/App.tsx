import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/LandingPage"
import Register from "./pages/RegisterPage"
import Login from "./pages/LoginPage"
import Cart from "./pages/CartPage"
import Schedule from "./pages/SchedulePage"
import AccountSettings from "./pages/AccountSettingsPage"

function App() {
  return (<BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth">
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
      </Route>

      <Route path="/cart" element={<Cart />} />

      <Route path="/schedule" element={<Schedule />} />

      <Route path="/account-settings" element={<AccountSettings />} />

      <Route path="*" element={<div>404! Page Not Found.</div>} />
    </Routes>
  </BrowserRouter>);
}

export default App;