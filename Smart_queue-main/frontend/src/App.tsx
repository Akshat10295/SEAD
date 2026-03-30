import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { CustomerPage } from './pages/CustomerPage';
import { CounterPage } from './pages/CounterPage';
import { AdminPage } from './pages/AdminPage';
import { DisplayPage } from './pages/DisplayPage';

function RoleRedirect() {
  const { state } = useApp();
  if (!state.user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    customer: '/customer', counter: '/counter',
    admin: '/admin', display: '/display',
  };
  return <Navigate to={map[state.user.role] ?? '/login'} replace />;
}

function AppLayout() {
  const { state } = useApp();
  const isDisplay = state.user?.role === 'display';

  return (
    <div className="min-h-screen">
      {!isDisplay && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer" element={
          <ProtectedRoute roles={['customer', 'admin']}><CustomerPage /></ProtectedRoute>
        } />
        <Route path="/counter" element={
          <ProtectedRoute roles={['counter', 'admin']}><CounterPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
        } />
        <Route path="/display" element={
          <ProtectedRoute roles={['display', 'admin']}><DisplayPage /></ProtectedRoute>
        } />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
