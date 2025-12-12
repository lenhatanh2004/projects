// Global Axios instance with automatic error handling
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from './users';
import { showErrorToast } from './toastConfig';

// Auto-detect host for emulator / web preview
function inferBaseUrl() {
  // Ưu tiên cấu hình từ users.js (setBaseUrl) để thống nhất host
  const configured = getBaseUrl?.();
  if (configured) {
    const trimmed = configured.endsWith('/')
      ? configured.slice(0, -1)
      : configured;
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }

  // React Native môi trường mobile sẽ rơi vào fetch layer, nhưng giữ fallback
  return 'http://192.168.1.155/api';
}

const api = axios.create({
  baseURL: inferBaseUrl(),
  timeout: 15000,
});

// Attach token if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (e) {
      console.log('[API] cannot read token', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const getServerMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message;

// Auto-handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      '[API ERROR]',
      error?.message,
      'status:',
      error?.response?.status,
      'code:',
      error?.code,
      'base:',
      api.defaults.baseURL,
    );

    if (!error.response) {
      showErrorToast(
        'Lỗi mạng',
        `Không thể kết nối đến ${api.defaults.baseURL}. Vui lòng kiểm tra Internet/BASE_URL.`,
      );
    } else {
      const status = error.response.status;
      const serverMessage = getServerMessage(error);

      if (status >= 500) {
        showErrorToast('Lỗi hệ thống', 'Máy chủ gặp sự cố. Vui lòng thử lại sau.');
      } else if (status === 404) {
        showErrorToast('Không tìm thấy', 'Tài nguyên không tồn tại (404).');
      } else if (status === 401) {
        showErrorToast(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục.',
        );
      } else {
        showErrorToast(
          'Đã xảy ra lỗi',
          serverMessage || `Mã lỗi ${status}. Vui lòng thử lại.`,
        );
      }
    }

    return Promise.reject(error);
  },
);

export default api;
