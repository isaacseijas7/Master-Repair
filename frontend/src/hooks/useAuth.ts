import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth(requireAuth: boolean = true) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, requireAuth, navigate]);

  return { isAuthenticated, isLoading, user };
}

export function useRequireRole(roles: string[]) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!user || !roles.includes(user.role)) {
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoading, user, roles, navigate]);

  return { hasRole: user ? roles.includes(user.role) : false };
}
