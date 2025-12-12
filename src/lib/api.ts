// src/lib/api.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'auth_token';

// Helpers quản lý token (dùng lại ở auth service / các chỗ khác)
export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * ⚠️ BASE URL BACKEND
 * - Bạn đang chạy BE trên máy với IP: 192.168.1.7, port 5000
 * - Chạy trên máy thật / Expo Go đều dùng URL này
 * - Sau này đổi WiFi / IP thì chỉ cần sửa chỗ này.
 */
const BASE = 'http://192.168.1.155:5000';

if (__DEV__) {
  console.log('[API BASE]', BASE);
}

// Nếu path đã là absolute URL thì dùng nguyên xi
function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

function buildUrl(path: string) {
  if (isAbsoluteUrl(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}

async function authHeaders(extra: Record<string, string> = {}) {
  const t = await getToken();
  if (__DEV__) {
    console.log(
      '[authHeaders] token:',
      t ? `${String(t).slice(0, 10)}…` : '(no token)'
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };

  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    try {
      const data = (await res.json()) as any;
      throw new Error(data?.message || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }
  return (await res.json()) as T;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && (path.startsWith('/api/sleep') || path.startsWith('/api/users'))) {
    console.log('[REQ GET]', url, headers.Authorization || '(no auth)');
  }
  const res = await fetch(url, { headers });
  return handle<T>(res);
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && (path.startsWith('/api/sleep') || path.startsWith('/api/users'))) {
    console.log('[REQ POST]', url, headers.Authorization || '(no auth)', 'body:', body);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep')) {
    console.log('[REQ PUT]', url, headers.Authorization || '(no auth)', 'body:', body);
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPatch<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep')) {
    console.log('[REQ PATCH]', url, headers.Authorization || '(no auth)', 'body:', body);
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  const headers = await authHeaders();
  if (__DEV__ && path.startsWith('/api/sleep')) {
    console.log('[REQ DELETE]', url, headers.Authorization || '(no auth)');
  }
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  return handle<T>(res);
}

