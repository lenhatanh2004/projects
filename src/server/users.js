// ==========================
//  USER API CLIENT (MERGED)
// ==========================

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =======================================
// BASE URL (t? d?ng detect theo platform)
// =======================================
let BASE_URL = 'http://192.168.1.155:5000';

export function setBaseUrl(url) {
  BASE_URL = url;
  console.log('[API BASE]', BASE_URL);
  BASE_URL = url;
  console.log('[API BASE]', BASE_URL);
}

export function getBaseUrl() {
  return BASE_URL;
}

export function getFullImageUrl(path) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  // Remove leading slash if BASE_URL ends with one, or vice versa to ensure single slash
  // But here BASE_URL doesn't have trailing slash usually.
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

// =======================================
// TOKEN STORAGE
// =======================================
export async function getToken() {
  const t = await AsyncStorage.getItem('accessToken');
  if (t) return t;
  return AsyncStorage.getItem('auth_token');
}

export async function setToken(token) {
  await AsyncStorage.setItem('accessToken', token);
  await AsyncStorage.setItem('auth_token', token);
}

export async function clearToken() {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('auth_token');
}


// =======================================
// L�i g?i API � KH�NG du?c d?i n?a
// =======================================
/**
* G?i API backend chung cho to�n app.
*
* @param {string} path - �u?ng d?n API, v� d?: "/api/posts"
* @param {{
*   method?: string,
*   body?: any,
*   auth?: boolean
* }} [options] - T�y ch?n khi g?i API
*
* method: "GET" | "POST" | "PUT" | "DELETE"
* body: d? li?u JSON g?i l�n (s? du?c JSON.stringify)
* auth: n?u true ? t? th�m Authorization: Bearer <token>
*
* @returns {Promise<any>} JSON response t? server
*/
export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const label = `[apiRequest] ${method} ${path}`;
  let maskedBody = body;
  if (body && typeof body === 'object') {
    try {
      maskedBody = JSON.parse(JSON.stringify(body));
      Object.keys(maskedBody).forEach((k) => {
        if (String(k).toLowerCase().includes('password')) {
          maskedBody[k] = '***';
        }
      });
    } catch { }
  }

  console.groupCollapsed?.(label);
  console.log('request:', { method, path, auth, body: maskedBody });

  try {
    if (auth) {
      const token = await getToken();
      if (!token) {
        console.groupEnd?.();
        throw new Error('No auth token, please login first');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type') || '';
    let json = null;

    if (contentType.includes('application/json')) {
      const text = await res.text();
      try {
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        console.warn('Cannot parse JSON, raw text:', text);
        throw new Error(`Invalid JSON from server: ${e.message}`);
      }
    } else {
      const text = await res.text();
      throw new Error(`Invalid JSON from server: ${text ? String(text).slice(0, 100) : 'Empty response'}`);
    }

    console.log('response status:', res.status);
    console.log('response body:', json);

    if (!res.ok) {
      const msg =
        (json && (json.message || json.error)) ||
        `Request failed with status ${res.status}`;
      throw new Error(msg);
    }

    console.groupEnd?.();
    return json;
  } catch (err) {
    console.error('API error:', err);
    console.groupEnd?.();
    throw err;
  }
}

// =======================================
// AUTH � LOGIN / REGISTER / LOGOUT
// =======================================

export async function register(payload) {
  const res = await apiRequest('/api/users/register', {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: payload.role || 'user',
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      address: payload.address,
    },
  });
  return res;
}

export async function login({ email, password }) {
  const res = await apiRequest('/api/users/login', {
    method: 'POST',
    body: { email, password },
  });

  // BE c� th? tr? token ? nhi?u noi ? h? tr? t?t c?
  const token =
    res?.token ||
    res?.data?.token ||
    res?.accessToken ||
    res?.data?.accessToken;

  if (!token) throw new Error('Token missing in response');

  await setToken(token);
  return res;
}

export async function logout() {
  try {
    await apiRequest('/api/users/logout', { method: 'POST', auth: true });
  } finally {
    await clearToken();
  }
}

export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

// =======================================
//  QU�N M?T KH?U
// =======================================
export async function forgotPassword(email) {
  return apiRequest('/api/users/forgotpassword', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyOTP({ email, otp }) {
  return apiRequest('/api/users/verifyOTP', {
    method: 'POST',
    body: { email, otp },
  });
}

export async function resetPassword({ email, password, confirmPassword }) {
  return apiRequest('/api/users/resetpassword', {
    method: 'POST',
    body: { email, password, confirmPassword },
  });
}

// =======================================
// PROFILE / USER INFO
// =======================================

// L?y th�ng tin user hi?n t?i
export async function getProfile() {
  return apiRequest('/api/users/me', { auth: true });
}

// L?y info user b?t k? (admin d�ng)
export async function getUserById(userId) {
  return apiRequest(`/api/users/${userId}`, { auth: true });
}

// C?p nh?t name / email / phone
export async function updateProfile(userId, payload) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

// Get user's friends list
export async function getUserFriends(userId, page = 1, limit = 20) {
  return apiRequest(`/api/social/friends/${userId}?page=${page}&limit=${limit}`, {
    auth: true,
  });
}

// Get friend requests
export async function getFriendRequests() {
  return apiRequest('/api/social/friends-requests?type=received', {
    auth: true,
  });
}

// Accept friend request
export async function acceptFriendRequest(friendId) {
  return apiRequest('/api/social/friends/accept', {
    method: 'POST',
    auth: true,
    body: { friendId },
  });
}

// Reject friend request
export async function rejectFriendRequest(friendId) {
  return apiRequest('/api/social/friends/reject', {
    method: 'POST',
    auth: true,
    body: { friendId },
  });
}

// C?p nh?t dateOfBirth / gender / address
export async function updateAdditionalInfo({ id, dateOfBirth, gender, address }) {
  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    auth: true,
    body: {
      dateOfBirth,
      gender,
      address,
    },
  });
}

// =======================================
// ADMIN � USER MANAGEMENT
// =======================================

// L?y danh s�ch user (c� ph�n trang)
export async function getAllUsers({ page = 1, limit = 20 } = {}) {
  return apiRequest(`/api/admin/users?page=${page}&limit=${limit}`, {
    auth: true,
  });
}

// Admin t?o t�i kho?n
export async function adminCreateUser(payload) {
  return apiRequest('/api/users/register', {
    method: 'POST',
    auth: true,
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: payload.role || 'user',
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      address: payload.address,
    },
  });
}

// Admin d?i vai tr� user
export async function updateUserRoleApi(userId, role) {
  return apiRequest(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    auth: true,
    body: { role },
  });
}

// Admin x�a user
export async function deleteUser(userId) {
  return apiRequest(`/api/users/${userId}`, {
    method: 'DELETE',
    auth: true,
  });
}
// =======================================
// UTILS (C?N TH�M �? FIX HABITS)
// =======================================
export function buildQuery(obj = {}) {
  const esc = encodeURIComponent;
  const q = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null)
    .map((k) => `${esc(k)}=${esc(obj[k])}`)
    .join('&');
  return q ? `?${q}` : '';
}
// ================================
// SOCIAL & COMMUNITY API LAYER
// D�ng chung apiRequest / buildQuery
// ================================

// ---------- POSTS ----------

// GET /api/posts/feed?page=1&limit=10
export async function getFeedPosts(params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/posts/feed${query}`, {
    method: 'GET',
    auth: true,
  });
}

// POST /api/posts
export async function createPostApi(payload) {
  // payload: { content, images?, visibility? }
  return apiRequest('/api/posts', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

// GET /api/posts/user/:userId
export async function getUserPosts(userId, params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/posts/user/${userId}${query}`, {
    method: 'GET',
    auth: true,
  });
}

// GET /api/posts/:postId
export async function getPostDetail(postId) {
  return apiRequest(`/api/posts/${postId}`, {
    method: 'GET',
    auth: true,
  });
}

// PUT /api/posts/:postId
export async function updatePost(postId, payload) {
  return apiRequest(`/api/posts/${postId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

// DELETE /api/posts/:postId
export async function deletePost(postId) {
  return apiRequest(`/api/posts/${postId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// POST /api/posts/:postId/like
export async function togglePostLike(postId) {
  return apiRequest(`/api/posts/${postId}/like`, {
    method: 'POST',
    auth: true,
  });
}

// GET /api/posts/:postId/likes?page=&limit=
export async function getPostLikes(postId, params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/posts/${postId}/likes${query}`, {
    method: 'GET',
    auth: true,
  });
}

// POST /api/posts/:postId/share
export async function sharePost(postId, payload) {
  // payload: { shareCaption?, visibility? }
  return apiRequest(`/api/posts/${postId}/share`, {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

// L?y trending hashtags
export async function getTrendingHashtags(limit = 10, days = 7) {
  return apiRequest(`/api/posts/trending/hashtags?limit=${limit}&days=${days}`, {
    method: 'GET',
    auth: true,
  });
}

// L?y b�i vi?t theo hashtag
export async function getPostsByHashtag(tag, page = 1, limit = 20) {
  return apiRequest(`/api/posts/hashtag/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`, {
    method: 'GET',
    auth: true,
  });
}

// ---------- COMMENTS ----------

// POST /api/comments  (comment ho?c reply)
export async function createCommentApi(payload) {
  // payload: { postId, content, parentCommentId? }
  return apiRequest('/api/comments', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

// GET /api/comments/post/:postId?page=&limit=&sort=
export async function getPostComments(postId, params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/comments/post/${postId}${query}`, {
    method: 'GET',
    auth: true,
  });
}

// GET /api/comments/:commentId/replies?page=&limit=
export async function getCommentReplies(commentId, params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/comments/${commentId}/replies${query}`, {
    method: 'GET',
    auth: true,
  });
}

// PUT /api/comments/:commentId
export async function updateComment(commentId, content) {
  return apiRequest(`/api/comments/${commentId}`, {
    method: 'PUT',
    auth: true,
    body: { content },
  });
}

// DELETE /api/comments/:commentId
export async function deleteComment(commentId) {
  return apiRequest(`/api/comments/${commentId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// POST /api/comments/:commentId/like
export async function toggleCommentLike(commentId) {
  return apiRequest(`/api/comments/${commentId}/like`, {
    method: 'POST',
    auth: true,
  });
}

// GET /api/comments/:commentId/likes?page=&limit=
export async function getCommentLikes(commentId, params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/api/comments/${commentId}/likes${query}`, {
    method: 'GET',
    auth: true,
  });
}



// ---------- SOCIAL (Friends & Block) ----------

// POST /api/social/friends/request  { friendId }
export async function sendFriendRequest(friendId) {
  return apiRequest('/api/social/friends/request', {
    method: 'POST',
    auth: true,
    body: { friendId },
  });
}

// DELETE /api/social/friends/unfriend  { friendId } (body c?a DELETE)
// kept as `unfriend` further below

// GET /api/social/friends?page=&limit=
export async function getMyFriends(page = 1, limit = 20) {
  return apiRequest(`/api/social/friends?page=${page}&limit=${limit}`, {
    method: 'GET',
    auth: true,
  });
}

// GET /api/social/friends/status/:userId
export async function getFriendStatus(userId) {
  return apiRequest(`/api/social/friends/status/${userId}`, {
    method: 'GET',
    auth: true,
  });
}

// POST /api/social/block  { blockedUserId, reason? }
export async function blockUser(blockedUserId, reason) {
  return apiRequest('/api/social/block', {
    method: 'POST',
    auth: true,
    body: { blockedUserId, reason },
  });
}

// DELETE /api/social/unblock  { blockedUserId }
export async function unblockUser(blockedUserId) {
  return apiRequest('/api/social/unblock', {
    method: 'DELETE',
    auth: true,
    body: { blockedUserId },
  });
}

// H?y k?t b?n / h?y l?i m?i k?t b?n
export async function unfriend(friendId) {
  return apiRequest('/api/social/friends/unfriend', {
    method: 'DELETE',
    auth: true,
    body: { friendId },
  });
}

// L?y danh s�ch user d� ch?n
export async function getBlockedUsers(page = 1, limit = 20) {
  return apiRequest(`/api/social/blocked?page=${page}&limit=${limit}`, {
    method: 'GET',
    auth: true,
  });
}

// NOTE: `cancelFriendRequest` removed per requested API contract
// ---------- PUBLIC PROFILE ----------

// GET /api/users/public/:userId (kh�ng c?n token)
export async function getPublicProfile(userId) {
  const res = await apiRequest(`/api/users/public/${userId}`, {
    method: 'GET',
    auth: true, // n?u public kh�ng c?n token cung kh�ng sao
  });
  return res.data;
}
// L?y th�ng tin user dang dang nh?p (d�ng token hi?n t?i)
export async function getCurrentUser() {
  const res = await apiRequest('/api/users/me', {
    method: 'GET',
    auth: true,
  });
  return res.data; // t�y BE, n?u BE tr? { success, data } th� data l� profile
}
// L?y trang c� nh�n c?ng d?ng c?a 1 user
// GET /api/social/profile/:userId
export async function getCommunityProfile(userId) {
  return apiRequest(`/api/social/profile/${userId}`, {
    method: 'GET',
    auth: true,
  });
}

