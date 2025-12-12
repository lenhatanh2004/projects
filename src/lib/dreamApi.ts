// projects/src/lib/dreamApi.ts
import { apiGet, apiPost, apiDelete } from './api';
import type { DreamItem, DreamStats } from '../types/dream';

export async function analyzeDream(dreamText: string): Promise<DreamItem> {
  // BE expect { dreamText }
  const res = await apiPost<{ data: DreamItem }>('/api/dreams/analyze', { dreamText });
  return res.data;
}

export async function fetchDreamHistory(page = 1, limit = 10, category?: string): Promise<any> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) q.append('category', category);
  // return full response so caller can read pagination info (res.data.docs, res.data.pagination, ...)
  const res = await apiGet<any>(`/api/dreams/history?${q.toString()}`);
  return res;
}

export async function fetchDreamStats(): Promise<DreamStats> {
  const res = await apiGet<{ data: DreamStats }>('/api/dreams/stats');
  return res.data;
}

export async function fetchDream(id: string): Promise<DreamItem> {
  const res = await apiGet<{ data: DreamItem }>(`/api/dreams/${id}`);
  return res.data;
}

export async function removeDream(id: string): Promise<void> {
  await apiDelete(`/api/dreams/${id}`);
}
