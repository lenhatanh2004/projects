import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LoginForm from "../components/forms/LoginForm";

function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <LoginForm onForgotPassword={() => { /* TODO: xử lý quên mật khẩu */ }} />
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;
