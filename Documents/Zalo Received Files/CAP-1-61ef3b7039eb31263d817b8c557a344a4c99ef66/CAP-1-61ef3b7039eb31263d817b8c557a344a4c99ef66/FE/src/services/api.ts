import axios from "axios";

// Tạo một instance axios chung
const api = axios.create({
  baseURL: "https://cap-1-1.onrender.com", // đổi lại theo port BE của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để gắn token (nếu cần)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
