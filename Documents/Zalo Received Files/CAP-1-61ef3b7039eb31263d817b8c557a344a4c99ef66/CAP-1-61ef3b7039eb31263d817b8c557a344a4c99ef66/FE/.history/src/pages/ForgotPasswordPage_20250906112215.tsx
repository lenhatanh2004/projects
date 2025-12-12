import { ForgotPasswordForm } from "../components/forms/ForgotPasswordForm";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function ForgotPasswordPage() {
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
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <ForgotPasswordForm onBackToLogin={() => (window.location.href = "/")} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
