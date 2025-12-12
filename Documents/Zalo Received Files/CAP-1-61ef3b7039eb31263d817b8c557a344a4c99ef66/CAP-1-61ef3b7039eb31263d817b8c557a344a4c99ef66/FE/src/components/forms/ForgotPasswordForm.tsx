import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Phone, Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log('Forgot password request for:', email);
  };

  return (
    <>
      {/* Lock Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quên mật khẩu?</h2>
        <p className="text-gray-600">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>
      </div>

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="reset-email" className="text-gray-700 mb-2 block">
            Email đã đăng ký
          </Label>
          <div className="w-full rounded-lg bg-green-50 p-2">
            <Input
              id="reset-email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-lg bg-primary hover:bg-primary-hover text-white"
        >
          Gửi hướng dẫn đặt lại
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center mt-6">
        <span className="text-gray-600">Nhớ lại mật khẩu? </span>
        <button
          onClick={onBackToLogin}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Đăng nhập ngay
        </button>
      </div>

      {/* Support Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-white text-sm">?</span>
          </div>
          <div>
            <h3 className="text-blue-900 font-medium mb-2">Cần hỗ trợ?</h3>
            <p className="text-blue-700 text-sm mb-3">
              Nếu bạn không nhận được email hoặc gặp vấn đề khác, vui lòng liên hệ:
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-700 text-sm">
                <Phone className="w-4 h-4" />
                <span>Hotline: 1900 1234</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700 text-sm">
                <Mail className="w-4 h-4" />
                <span>Email: support@farmassistant.vn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}