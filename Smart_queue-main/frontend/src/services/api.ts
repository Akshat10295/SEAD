import axios, { AxiosError } from 'axios';
import type {
  AuthUser, QueueState, Counter, CreateTokenResponse,
  AdminStats, LogEntry, QueueToken
} from '../types';

const BASE = '/api';

const api = axios.create({ baseURL: BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    }
  } catch {
    localStorage.removeItem('auth');
  }
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = (err.response?.data as { detail?: string })?.detail;
    return detail || err.message || 'Unknown error';
  }
  return String(err);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string): Promise<AuthUser> => {
    try {
      const { data } = await api.post('/auth/login', { username, password });
      return data as AuthUser;
    } catch (e) { throw new Error(extractError(e)); }
  },
  register: async (username: string, password: string, role: string): Promise<AuthUser> => {
    try {
      const { data } = await api.post('/auth/register', { username, password, role });
      return data as AuthUser;
    } catch (e) { throw new Error(extractError(e)); }
  },
};

// ── Queue ─────────────────────────────────────────────────────────────────────
export const queueApi = {
  getQueue: async (): Promise<QueueState> => {
    try {
      const { data } = await api.get('/queue');
      return data as QueueState;
    } catch (e) { throw new Error(extractError(e)); }
  },
  createToken: async (): Promise<CreateTokenResponse> => {
    try {
      const { data } = await api.post('/token');
      return data as CreateTokenResponse;
    } catch (e) { throw new Error(extractError(e)); }
  },
};

// ── Counter ───────────────────────────────────────────────────────────────────
export const counterApi = {
  getCounters: async (): Promise<Counter[]> => {
    try {
      const { data } = await api.get('/counter/');
      return data as Counter[];
    } catch (e) { throw new Error(extractError(e)); }
  },
  next: async (counterId: number): Promise<QueueToken> => {
    try {
      const { data } = await api.post(`/counter/${counterId}/next`);
      return data as QueueToken;
    } catch (e) { throw new Error(extractError(e)); }
  },
  complete: async (counterId: number): Promise<QueueToken> => {
    try {
      const { data } = await api.post(`/counter/${counterId}/complete`);
      return data as QueueToken;
    } catch (e) { throw new Error(extractError(e)); }
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    try {
      const { data } = await api.get('/admin/stats');
      return data as AdminStats;
    } catch (e) { throw new Error(extractError(e)); }
  },
  getLogs: async (limit = 100): Promise<LogEntry[]> => {
    try {
      const { data } = await api.get(`/admin/logs?limit=${limit}`);
      return data as LogEntry[];
    } catch (e) { throw new Error(extractError(e)); }
  },
  reset: async (password: string): Promise<void> => {
    try {
      await api.post('/admin/reset', { confirm_password: password });
    } catch (e) { throw new Error(extractError(e)); }
  },
  exportLogs: () => {
    const raw = localStorage.getItem('auth');
    let token = '';
    try { token = (JSON.parse(raw || '{}') as AuthUser).access_token || ''; } catch { /* */ }
    window.open(`${BASE}/admin/logs/export?token=${token}`, '_blank');
  },
};
