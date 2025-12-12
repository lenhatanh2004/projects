import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LoginForm from "../components/forms/LoginForm"; // 👈 import form đầy đủ

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F1FBF4]">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <img
            src="/plant.png"
            alt="Farm Assistant"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-semibold text-green-700">Farm Assistant</span>
        </div>
        <a href="/" className="text-sm font-medium text-green-600 hover:underline">
          ← Về trang chủ
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          {/* Gọi lại LoginForm đầy đủ */}
          <LoginForm onForgotPassword={() => (window.location.href = "/forgot")} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
