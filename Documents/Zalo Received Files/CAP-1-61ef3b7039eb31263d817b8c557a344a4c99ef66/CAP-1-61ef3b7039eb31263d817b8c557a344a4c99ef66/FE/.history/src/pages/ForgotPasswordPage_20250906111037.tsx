import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ForgotPasswordForm from "../components/forms/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F1FBF4]">
      <Header />

      <main className="flex flex-1 items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
          <ForgotPasswordForm onBackToLogin={() => (window.location.href = "/")} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
