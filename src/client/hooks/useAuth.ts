import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();

  const { data, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: api.getAuthStatus,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isCheckingAuth) {
      setUser(data?.user ?? null);
    }
  }, [data, isCheckingAuth, setUser]);

  const login = () => authLogin();
  const logout = () => authLogout();

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isCheckingAuth,
    login,
    logout,
  };
};
