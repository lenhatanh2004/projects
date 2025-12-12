// projects/src/server/sleep.js
import { apiRequest, setBaseUrl } from './users';

// Map emoji → enum wakeMood bên BE
const moodMap = { '😴': 'met', '😐': 'thu_gian', '😊': 'vui' };

// Map nhãn checkbox UI → enum factors của BE
const factorMap = {
  'Uống coffee': 'cafe',
  'Tập luyện': 'tap_luyen',
  'Stress': 'stress',
  'Ăn muộn': 'an_muon',
  'Đọc sách': 'doc_sach',
  'Xem phim': 'xem_phim',
  'Tắm nước ấm': 'tam_nuoc_am',
};

// ==== APIs ====
// Tạo 1 log (UI đang nhập dạng date + time → BE hỗ trợ date/sleepTime/wakeTime)
export function createSleepLog({ date, sleepTime, wakeTime, quality, mood, factors = [], notes }) {
  return apiRequest('/api/sleep/logs', {
    method: 'POST',
    auth: true,
    body: {
      date,
      sleepTime,       // ví dụ: "10:30 PM"
      wakeTime,        // ví dụ: "7:00 AM"
      quality,         // 1..5
      wakeMood: moodMap[mood] ?? 'thu_gian',
      factors: factors.map((f) => factorMap[f]).filter(Boolean),
      notes: notes || '',
    },
  });
}

export function listSleepLogs({ page = 1, limit = 10 } = {}) {
  return apiRequest(`/api/sleep/logs?page=${page}&limit=${limit}`, { auth: true });
}

export function sleepStats() {
  return apiRequest('/api/sleep/stats', { auth: true });
}

export function updateSleepLog(id, payload) {
  // payload có thể là { date, sleepTime, wakeTime, quality, mood, factors, notes }
  const body = { ...payload };
  if (body.mood) body.wakeMood = moodMap[body.mood] ?? 'thu_gian';
  if (body.factors) body.factors = body.factors.map((f) => factorMap[f]).filter(Boolean);
  return apiRequest(`/api/sleep/logs/${id}`, { method: 'PUT', auth: true, body });
}

export function deleteSleepLog(id) {
  return apiRequest(`/api/sleep/logs/${id}`, { method: 'DELETE', auth: true });
}

// Cho phép màn login đặt BASE_URL một lần cho toàn app
export const setSleepApiBaseUrl = setBaseUrl;
