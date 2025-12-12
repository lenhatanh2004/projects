import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LoginForm from "../components/forms/LoginForm";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F1FBF4]">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        
          <LoginForm onForgotPassword={() => { /* TODO: xử lý quên mật khẩu */ }} />
        
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
