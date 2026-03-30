import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LogOut, Monitor } from 'lucide-react';

const roleLinks: Record<string, { to: string; label: string }[]> = {
  customer: [{ to: '/customer', label: 'My Queue' }],
  counter: [{ to: '/counter', label: 'Counter' }],
  admin: [{ to: '/admin', label: 'Admin' }, { to: '/counter', label: 'Counter' }],
  display: [{ to: '/display', label: 'Display' }],
};

export function Navbar() {
  const { state, logout } = useApp();
  const location = useLocation();
  const links = state.user ? (roleLinks[state.user.role] ?? []) : [];

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6" />
          <span className="font-bold text-lg">SmartQueue</span>
        </div>
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors
                ${location.pathname === l.to ? 'bg-white text-blue-700' : 'hover:bg-blue-600'}`}
            >
              {l.label}
            </Link>
          ))}
          {state.user && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs opacity-80">{state.user.username} ({state.user.role})</span>
              <button onClick={logout} className="hover:text-red-300 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
