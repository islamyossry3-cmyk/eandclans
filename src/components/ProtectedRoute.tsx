import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Loading } from './shared/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
