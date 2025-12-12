import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LoginForm from "../components/forms/LoginForm";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F1FBF4]">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-lg font-semibold text-green-700">Farm Assistant</span>
        </div>
        <a href="/" className="text-sm font-medium text-green-600 hover:underline">
          ← Về trang chủ
        </a>
      </header>
      <Header />
      <main className="flex-1">
        <div className="flex min-h-screen items-center justify-center">
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
