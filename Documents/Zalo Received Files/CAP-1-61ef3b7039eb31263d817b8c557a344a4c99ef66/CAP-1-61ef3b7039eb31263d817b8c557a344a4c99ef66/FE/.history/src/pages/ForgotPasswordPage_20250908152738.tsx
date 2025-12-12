import  ForgotPasswordForm  from "../components/forms/ForgotPasswordForm";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F1FBF4]">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        
          <ForgotPasswordForm onBackToLogin={() => (window.location.href = "/")} />
        
      </main>
      <Footer />
    </div>
  );
}
