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
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md p-8">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Quên mật khẩu</h1>
          <form className="space-y-4">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              Gửi yêu cầu
            </button>
          </form>
        </div>
      </main>
      <footer>{/* Footer ở đây nếu có */}</footer>
    </div>
  );
}
