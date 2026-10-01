import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/LandingPage";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import Provider from "./pages/Provider";
import SuperUser from "./components/superuser/superuser_route";
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
          <Route path="*" element={<div>404! Page Not Found.</div>} />
        </Routes>
      </BrowserRouter>
    </ReduxProvider>
  );
}

export default App;
