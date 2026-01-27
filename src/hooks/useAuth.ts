import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAuthStatus } from '~/server/functions/auth';
import { useAuthStore } from '~/store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();

  const { data, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => getAuthStatus(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isCheckingAuth) {
      setUser(data?.user ?? null);
    }
  }, [data, isCheckingAuth, setUser]);

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isCheckingAuth,
    login,
    logout,
  };
};
