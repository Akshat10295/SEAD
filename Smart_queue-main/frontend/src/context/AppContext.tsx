import React, {
  createContext, useContext, useReducer, useEffect,
  useCallback, useMemo, type ReactNode
} from 'react';
import type { AppState, AppAction, AuthUser, QueueState, Counter, WSMessage } from '../types';
import { wsService } from '../services/websocket';

const initialQueue: QueueState = { waiting: [], serving: [], total_waiting: 0, total_serving: 0 };

const initialState: AppState = {
  user: null,
  queue: initialQueue,
  counters: [],
  loading: {},
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_COUNTERS':
      return { ...state, counters: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_AUTH':
      return { ...initialState };
    default:
      return state;
  }
}

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setLoading: (key: string, val: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<ContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.access_token || !parsed?.role) return null;
    return parsed;
  } catch {
    localStorage.removeItem('auth');
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    user: loadStoredUser(),
  });

  const setLoading = useCallback((key: string, val: boolean) => {
    dispatch({ type: 'SET_LOADING', key, value: val });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    wsService.disconnect();
    dispatch({ type: 'CLEAR_AUTH' });
  }, []);

  // Persist user
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('auth', JSON.stringify(state.user));
    }
  }, [state.user]);

  // WebSocket
  useEffect(() => {
    if (!state.user) return;
    wsService.connect();
    const unsub = wsService.subscribe((msg: WSMessage) => {
      if (msg.type === 'QUEUE_UPDATE') {
        dispatch({ type: 'SET_QUEUE', payload: msg.payload as QueueState });
      } else if (msg.type === 'QUEUE_RESET') {
        dispatch({ type: 'SET_QUEUE', payload: initialQueue });
      }
    });
    return () => {
      unsub();
      wsService.disconnect();
    };
  }, [state.user]);

  const value = useMemo(() => ({ state, dispatch, setLoading, logout }), [state, setLoading, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
