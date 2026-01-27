import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '~/server/services/cookies';
import type { AuthStatus, AuthUser } from '~/shared/types/auth';

export const getAuthStatus = createServerFn({ method: 'GET' }).handler(async (): Promise<AuthStatus> => {
  const accessToken = getCookie('access_token');
  const userInfo = getCookie('user_info');

  if (!accessToken || !userInfo) {
    return { authenticated: false };
  }

  try {
    const user = JSON.parse(userInfo) as AuthUser;

    return {
      authenticated: true,
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error('Failed to parse user info:', error);

    return { authenticated: false };
  }
});
