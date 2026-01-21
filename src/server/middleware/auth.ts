import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../app.ts';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const accessToken = getCookie(c, 'access_token');
  const userInfo = getCookie(c, 'user_info');

  if (accessToken && userInfo) {
    try {
      const user = JSON.parse(userInfo);
      c.set('user', {
        sub: user.sub,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error('Failed to parse user info:', error);
    }
  }

  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorised', code: 'UNAUTHORISED' }, 401);
  }

  await next();
});
