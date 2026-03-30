import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { state } = useApp();

  if (!state.user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(state.user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
