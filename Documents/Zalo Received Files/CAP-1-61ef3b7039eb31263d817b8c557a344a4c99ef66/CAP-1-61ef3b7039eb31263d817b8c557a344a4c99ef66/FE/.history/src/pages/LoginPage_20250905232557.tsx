import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LoginForm from "../components/forms/LoginForm";
import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="flex min-h-screen items-center justify-center bg-green-50">
          <LoginForm onForgotPassword={() => { /* TODO: xử lý quên mật khẩu */ }} />
        </div>
      </main>
      <Footer />
      <div className="text-center mb-4">
        <Link to="/forgot" className="text-green-600">
          Quên mật khẩu?
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
