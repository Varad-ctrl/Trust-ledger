import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Spinner';

// Redirects to /login if not authenticated
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Redirects to /dashboard if not ADMIN
export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// Redirects authenticated users away from login/register
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return !user ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
