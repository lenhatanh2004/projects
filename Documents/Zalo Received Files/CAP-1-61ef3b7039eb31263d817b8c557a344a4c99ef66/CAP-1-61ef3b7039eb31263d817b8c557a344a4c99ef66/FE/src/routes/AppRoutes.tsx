import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Trang chính sau khi login */}
        <Route path="/" element={<HomePage />} />

        {/* Nếu không match route nào thì về login */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
