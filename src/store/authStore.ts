import { atom, useAtomValue, useSetAtom } from 'jotai';
import type { AuthUser } from '~/shared/types/auth';

// Primitive atoms
export const userAtom = atom<AuthUser | null>(null);
export const isLoadingAtom = atom(true);

// Derived atoms
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

// Action atoms
export const setUserAtom = atom(null, (_get, set, user: AuthUser | null) => {
  set(userAtom, user);
  set(isLoadingAtom, false);
});

export const setLoadingAtom = atom(null, (_get, set, loading: boolean) => {
  set(isLoadingAtom, loading);
});

export const logoutAtom = atom(null, (_get, set) => {
  set(userAtom, null);
  set(isLoadingAtom, false);
});

// Custom hook for convenient access (similar to Zustand's useStore)
export const useAuthStore = () => {
  const user = useAtomValue(userAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const isLoading = useAtomValue(isLoadingAtom);

  const setUser = useSetAtom(setUserAtom);
  const setLoading = useSetAtom(setLoadingAtom);
  const logout = useSetAtom(logoutAtom);

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setLoading,
    logout,
  };
};
