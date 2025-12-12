// server/habits.js
// Wrapper cho toàn bộ Habits API (FlowState BE)

// ⬇️ Import apiRequest đã chuẩn hóa từ users.js
import { apiRequest, buildQuery } from './users';
import api from './notifi';

/* ------------------------------------------------------------------ */
/* HABITS CRUD                                                        */
/* ------------------------------------------------------------------ */

export function getHabits() {
  // GET /api/habits
  return apiRequest('/api/habits', { auth: true });
}
export function getHabit(id) {
  return apiRequest(`/api/habits/${id}`, { auth: true });
}

export function createHabit(payload) {
  // POST /api/habits
  // payload: { name, category, description?, icon?, color?, frequency?, ... }
  return apiRequest('/api/habits', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function updateHabit(habitId, payload) {
  // PUT /api/habits/:habitId
  return apiRequest(`/api/habits/${habitId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}
export function getQuestionSurvey(habitId) {
  return apiRequest(`/api/survey/session`,
     {
      method: 'GET',
      auth: true });
}
export function deleteHabit(habitId) {
  // DELETE /api/habits/:habitId
  return apiRequest(`/api/habits/${habitId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* TRACKING - CHECK MODE                                              */
/* ------------------------------------------------------------------ */

export function trackHabit(habitId, payload) {
  // POST /api/habits/:habitId/track
  // payload: { status, notes?, date?, mood? }
  return apiRequest(`/api/habits/${habitId}/track`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function getHabitTrackings(habitId, query) {
  // GET /api/habits/:habitId/trackings
  const q = buildQuery(query);
  return apiRequest(`/api/habits/${habitId}/trackings${q}`, { auth: true });
}

export function updateTracking(habitId, trackingId, payload) {
  // PUT /api/habits/:habitId/trackings/:trackingId
  return apiRequest(`/api/habits/${habitId}/trackings/${trackingId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

export function deleteTracking(habitId, trackingId) {
  // DELETE /api/habits/:habitId/trackings/:trackingId
  return apiRequest(`/api/habits/${habitId}/trackings/${trackingId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* COUNT MODE - XÓA CẢ NGÀY                                           */
/* ------------------------------------------------------------------ */

export function deleteTrackingDay(habitId, date) {
  // DELETE /api/habits/:habitId/trackingsday/:date
  return apiRequest(
    `/api/habits/${habitId}/trackingsday/${encodeURIComponent(date)}`,
    { method: 'DELETE', auth: true }
  );
}

/* ------------------------------------------------------------------ */
/* SUB-TRACKING (COUNT MODE)                                          */
/* ------------------------------------------------------------------ */

export function getSubTrackings(habitId, query = {}) {
  // Tách riêng date ra khỏi query
  const { date, ...rest } = query || {};

  // buildQuery cho phần còn lại (limit, page, ...)
  const q = buildQuery(rest); // vd: ?limit=100

  // nếu có date thì gắn thêm vào cuối path
  const dateSegment = date ? `?date=${encodeURIComponent(date)}` : '';

  const url = `/api/habits/${habitId}/subtrack${dateSegment}`;

  const res = apiRequest(url, { auth: true });
  console.log('subtrack url:', url, 'res:', res);
  return res;
}


export function addSubTracking(habitId, payload) {
  // POST /api/habits/:habitId/subtrack
  // payload: { quantity?, date?, startTime, endTime?, note?, mood?, override? }
  return apiRequest(`/api/habits/${habitId}/subtrack`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}
export function submitSurvey(ans) {
  // POST /api/habits/:habitId/subtrack
  // payload: { quantity?, date?, startTime, endTime?, note?, mood?, override? }
  console.log(ans);
  
  return apiRequest(`/api/survey/submit`, {
    method: 'POST',
    body: ans,
    auth: true,
  });
}
export function updateSubTracking(habitId, subId, payload) {
  // PUT /api/habits/:habitId/subtrack/:subId
  return apiRequest(`/api/habits/${habitId}/subtrack/${subId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

export function deleteSubTracking(habitId, subId) {
  // DELETE /api/habits/:habitId/subtrack/:subId
  return apiRequest(`/api/habits/${habitId}/subtrack/${subId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* HISTORY & STATS                                                    */
/* ------------------------------------------------------------------ */

export function getHabitStats(habitId, query) {
  // GET /api/habits/:habitId/stats
  const q = buildQuery(query);
  return apiRequest(`/api/habits/${habitId}/stats${q}`, { auth: true });
}

export function getHabitCalendar(habitId, query) {
  // GET /api/habits/:habitId/calendar
  const q = buildQuery(query);
  return apiRequest(`/api/habits/${habitId}/calendar${q}`, { auth: true });
}

export function getHabitHistory(habitId, query) {
  // GET /api/habits/:habitId/history
  const q = buildQuery(query);
  return apiRequest(`/api/habits/${habitId}/history${q}`, { auth: true });
}

export function getAllHabitsHistory(query) {
  // GET /api/habits/history/all
  const q = buildQuery(query);
  return apiRequest(`/api/habits/history/all${q}`, { auth: true });
}

/* ------------------------------------------------------------------ */
/* TEMPLATES & SUGGESTIONS                                            */
/* ------------------------------------------------------------------ */

export function getHabitTemplates(query) {
  // GET /api/habits/templates
  const q = buildQuery(query);
  return apiRequest(`/api/habits/templates${q}`, { auth: true });
}

export function createHabitFromTemplate(templateId) {
  // POST /api/habits/templates/:templateId
  return apiRequest(`/api/habits/templates/${templateId}`, {
    method: 'POST',
    auth: true,
  });
}

export function getHabitTemplateById(templateId) {
  // GET /api/habits/templates/:templateId
  return apiRequest(`/api/habits/templates/${templateId}`, { auth: true });
}

export function getHabitTemplatesByCategory(category) {
  // GET /api/habits/templates/category/:category
  return apiRequest(`/api/habits/templates/category/${encodeURIComponent(category)}`, { auth: true });
}

export function addHabitsFromRecommendations(payload) {
  // POST /api/habits/recommendations
  // payload: { habitIds: [...], customizations: {...} }
  return apiRequest('/api/habits/recommendations', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* DASHBOARD & REPORTS                                                */
/* ------------------------------------------------------------------ */

export function getTodayOverview() {
  // GET /api/habits/overview/today
  return apiRequest('/api/habits/overview/today', { auth: true });
}

export function getWeeklyReport(weekOffset = 0) {
  // GET /api/habits/reports/weekly?weekOffset=0
  const q = buildQuery({ weekOffset });
  return apiRequest(`/api/habits/reports/weekly${q}`, { auth: true });
}

export function getPersonalInsights() {
  // GET /api/habits/insights/personal
  return apiRequest('/api/habits/insights/personal', { auth: true });
}

/* ------------------------------------------------------------------ */
/* BULK OPERATIONS                                                    */
/* ------------------------------------------------------------------ */

export function reorderHabits(habitOrders) {
  // PUT /api/habits/bulk/reorder
  // habitOrders: [{ habitId, order }, ...]
  return apiRequest('/api/habits/bulk/reorder', {
    method: 'PUT',
    body: { habitOrders },
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* REMINDERS                                                          */
/* ------------------------------------------------------------------ */

export function getHabitReminders(habitId) {
  // GET /api/habits/:habitId/reminders
  return apiRequest(`/api/habits/${habitId}/reminders`, { auth: true });
}

export function getTodayReminders() {
  // GET /api/habits/reminders/today
  return apiRequest('/api/habits/reminders/today', { auth: true });
}

export function createHabitReminder(habitId, payload) {
  // POST /api/habits/:habitId/reminders
  return apiRequest(`/api/habits/${habitId}/reminders`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function updateHabitReminder(habitId, reminderId, payload) {
  // PUT /api/habits/:habitId/reminders/:reminderId
  return apiRequest(`/api/habits/${habitId}/reminders/${reminderId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

export function deleteHabitReminder(habitId, reminderId) {
  // DELETE /api/habits/:habitId/reminders/:reminderId
  return apiRequest(`/api/habits/${habitId}/reminders/${reminderId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* GOALS                                                              */
/* ------------------------------------------------------------------ */

export function getHabitGoals(habitId, status = 'active') {
  // GET /api/habits/:habitId/goals?status=
  const q = buildQuery({ status });
  return apiRequest(`/api/habits/${habitId}/goals${q}`, { auth: true });
}

export function createHabitGoal(habitId, payload) {
  // POST /api/habits/:habitId/goals
  return apiRequest(`/api/habits/${habitId}/goals`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export function updateHabitGoal(habitId, goalId, payload) {
  // PUT /api/habits/:habitId/goals/:goalId
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

export function completeHabitGoal(habitId, goalId) {
  // POST /api/habits/:habitId/goals/:goalId/complete
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}/complete`, {
    method: 'POST',
    auth: true,
  });
}

export function deleteHabitGoal(habitId, goalId) {
  // DELETE /api/habits/:habitId/goals/:goalId
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function getGoalsOverview() {
  // GET /api/habits/goals/overview
  return apiRequest('/api/habits/goals/overview', { auth: true });
}

export function syncGoals(payload) {
  // POST /api/habits/goals/sync
  // ⚠️ BE hiện đang đọc req.params.habitId -> có thể là bug
  return apiRequest('/api/habits/goals/sync', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

/* ------------------------------------------------------------------ */
/* AI HABIT RECOMMENDATIONS                                           */
/* ------------------------------------------------------------------ */

export function recommendHabits(answers, limit = 5) {
  // POST /api/ai-habits/recommend?limit=5
  const q = buildQuery({ limit });
  // This route might not need auth, but we add it for consistency.
  // If it fails, change auth to false.
  console.log(answers);
  
  return apiRequest(`/api/ai-habit/recommend${q}`, {
    method: 'POST',
    body: { answers },
    auth: true,
  });
}
