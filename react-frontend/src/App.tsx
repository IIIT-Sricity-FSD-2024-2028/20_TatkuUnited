import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/LandingPage"
import Register from "./pages/RegisterPage"
import Login from "./pages/LoginPage"

function App() {
  return (<BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth">
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
      </Route>
      <Route path="*" element={<div>404! Page Not Found.</div>} />
    </Routes>
  </BrowserRouter>);
}

export default App;