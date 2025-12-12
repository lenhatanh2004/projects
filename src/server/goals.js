// Goals service for habit endpoints
import { apiRequest } from './users';

// GET /api/habits/:habitId/goals (optional status query)
export async function getHabitGoals(habitId, status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/habits/${habitId}/goals${q}`, { auth: true });
}

// POST /api/habits/:habitId/goals
export async function createHabitGoal(habitId, payload) {
  return apiRequest(`/api/habits/${habitId}/goals`, {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

// PUT /api/habits/:habitId/goals/:goalId
export async function updateHabitGoal(habitId, goalId, payload) {
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}

// POST /api/habits/:habitId/goals/:goalId/complete
export async function completeHabitGoal(habitId, goalId) {
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}/complete`, {
    method: 'POST',
    auth: true,
  });
}

// DELETE /api/habits/:habitId/goals/:goalId
export async function deleteHabitGoal(habitId, goalId) {
  return apiRequest(`/api/habits/${habitId}/goals/${goalId}`, {
    method: 'DELETE',
    auth: true,
  });
}
