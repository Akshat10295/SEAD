export type UserRole = 'customer' | 'counter' | 'admin' | 'display';

export interface AuthUser {
  username: string;
  role: UserRole;
  access_token: string;
}

export interface QueueToken {
  id: number;
  status: 'waiting' | 'serving' | 'completed';
  created_at: string;
  completed_at: string | null;
  counter_id: number | null;
}

export interface CreateTokenResponse {
  token: QueueToken;
  position: number;
  estimated_wait_minutes: number;
}

export interface QueueState {
  waiting: QueueToken[];
  serving: QueueToken[];
  total_waiting: number;
  total_serving: number;
}

export interface Counter {
  id: number;
  is_active: boolean;
  current_token_id: number | null;
  current_token: QueueToken | null;
}

export interface AdminStats {
  total_waiting: number;
  total_serving: number;
  total_completed: number;
  active_counters: number;
  total_counters: number;
}

export interface LogEntry {
  id: number;
  token_id: number | null;
  action: string;
  performed_by: number | null;
  timestamp: string;
  details: string | null;
}

export interface WSMessage {
  type: 'QUEUE_UPDATE' | 'QUEUE_RESET';
  payload: QueueState | { message: string };
}

// App State
export interface AppState {
  user: AuthUser | null;
  queue: QueueState;
  counters: Counter[];
  loading: Record<string, boolean>;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_QUEUE'; payload: QueueState }
  | { type: 'SET_COUNTERS'; payload: Counter[] }
  | { type: 'SET_LOADING'; key: string; value: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_AUTH' };
