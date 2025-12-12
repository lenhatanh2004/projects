// Inventory service for streak shields, freeze tokens, revive tokens, and protection settings
import { apiRequest } from './users';

// GET /api/inventory
export async function getInventory() {
  return apiRequest('/api/inventory', { auth: true });
}

// POST /api/inventory/use-shield
export async function useShield(payload) {
  // payload: { habitId, date? }
  return apiRequest('/api/inventory/use-shield', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

// POST /api/inventory/use-freeze
export async function useFreeze(payload) {
  // payload: { habitId, days, startDate? }
  return apiRequest('/api/inventory/use-freeze', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

// POST /api/inventory/use-revive
export async function useRevive(payload) {
  // payload: { habitId, date }
  return apiRequest('/api/inventory/use-revive', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

// GET /api/inventory/protection-settings
export async function getProtectionSettings() {
  return apiRequest('/api/inventory/protection-settings', { auth: true });
}

// PUT /api/inventory/protection-settings
export async function updateProtectionSettings(payload) {
  // payload: { enabled: boolean }
  return apiRequest('/api/inventory/protection-settings', {
    method: 'PUT',
    body: payload,
    auth: true,
  });
}
