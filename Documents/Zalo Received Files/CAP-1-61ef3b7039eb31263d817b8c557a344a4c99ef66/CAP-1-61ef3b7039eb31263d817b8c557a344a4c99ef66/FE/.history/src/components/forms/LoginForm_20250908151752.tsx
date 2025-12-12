import { useState } from "react";
import { Link } from "react-router-dom";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto space-y-4"
    >
      {/* Icon + tiêu đề */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 text-white">
          <i className="fas fa-user text-xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
        <p className="text-gray-600">Chào mừng bạn trở lại Farm Assistant</p>
      </div>

      {/* Input email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email hoặc số điện thoại
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-green-500"
          placeholder="Nhập email của bạn"
        />
      </div>

      {/* Input password */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Mật khẩu
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-green-500"
          placeholder="Nhập mật khẩu"
        />
      </div>

      {/* Ghi nhớ & quên mật khẩu */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          Ghi nhớ đăng nhập
        </label>
        <Link to="/forgot" className="text-green-600 hover:underline">
          Quên mật khẩu?
        </Link>
      </div>

      {/* Nút đăng nhập */}
      <button
        type="submit"
        className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
      >
        Đăng nhập
      </button>

      {/* Đăng ký */}
      <p className="text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-medium text-green-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>

      {/* Đăng nhập bằng Google & Facebook */}
      <div className="mt-4">
        <p className="text-center text-sm text-gray-500">Hoặc đăng nhập bằng</p>
        <div className="mt-2 flex space-x-2">
          <button className="w-1/2 rounded-lg border border-gray-300 py-2 hover:bg-gray-50">
            Google
          </button>
          <button className="w-1/2 rounded-lg border border-gray-300 py-2 hover:bg-gray-50">
            Facebook
          </button>
        </div>
      </div>
    </form>
  );
}
