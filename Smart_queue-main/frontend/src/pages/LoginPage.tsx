import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';
import { Button } from '../components/ui';
import type { UserRole } from '../types';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  customer: '/customer',
  counter: '/counter',
  admin: '/admin',
  display: '/display',
};

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await authApi.login(username.trim(), password)
        : await authApi.register(username.trim(), password, role);

      dispatch({ type: 'SET_USER', payload: data });
      toast.success(`Welcome, ${data.username}!`);
      navigate(ROLE_REDIRECTS[data.role as UserRole] ?? '/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">SmartQueue</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Queue Management System</p>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors
                ${mode === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {mode === 'register' && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">Customer</option>
              <option value="counter">Counter Staff</option>
              <option value="admin">Admin</option>
              <option value="display">Display Screen</option>
            </select>
          )}
          <Button onClick={handleSubmit} loading={loading} className="w-full">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
