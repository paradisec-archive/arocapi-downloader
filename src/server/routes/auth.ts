import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { AppEnv } from '../app.ts';
import { config } from '../services/config.ts';
import {
  exchangeCodeForTokens,
  generateState,
  getAuthorizationUrl,
  getLogoutUrl,
  getUserInfo,
  verifyIdToken,
} from '../services/oidc.ts';

export const authRoutes = new Hono<AppEnv>();

authRoutes.get('/login', async (c) => {
  const state = generateState();

  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
  });

  const authUrl = await getAuthorizationUrl(state);

  return c.redirect(authUrl);
});

authRoutes.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  const errorDescription = c.req.query('error_description');

  if (error) {
    console.error('OIDC error:', error, errorDescription);

    return c.redirect(`/?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return c.redirect('/?error=No%20authorization%20code%20received');
  }

  const savedState = getCookie(c, 'oauth_state');

  if (!savedState || savedState !== state) {
    return c.redirect('/?error=Invalid%20state%20parameter');
  }

  deleteCookie(c, 'oauth_state', { path: '/' });

  try {
    const tokens = await exchangeCodeForTokens(code);

    let user;
    if (tokens.id_token) {
      user = await verifyIdToken(tokens.id_token);
    } else {
      user = await getUserInfo(tokens.access_token);
    }

    const maxAge = tokens.expires_in || 3600;

    setCookie(c, 'access_token', tokens.access_token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge,
    });

    if (tokens.id_token) {
      setCookie(c, 'id_token', tokens.id_token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge,
      });
    }

    setCookie(c, 'user_info', JSON.stringify(user), {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge,
    });

    return c.redirect('/browser');
  } catch (err) {
    console.error('Token exchange error:', err);

    return c.redirect('/?error=Authentication%20failed');
  }
});

authRoutes.get('/me', (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ authenticated: false }, 401);
  }

  return c.json({
    authenticated: true,
    user,
  });
});

authRoutes.get('/logout', async (c) => {
  const idToken = getCookie(c, 'id_token');

  deleteCookie(c, 'access_token', { path: '/' });
  deleteCookie(c, 'id_token', { path: '/' });
  deleteCookie(c, 'user_info', { path: '/' });

  const logoutUrl = await getLogoutUrl(idToken);

  return c.redirect(logoutUrl);
});

authRoutes.post('/logout', async (c) => {
  const idToken = getCookie(c, 'id_token');

  deleteCookie(c, 'access_token', { path: '/' });
  deleteCookie(c, 'id_token', { path: '/' });
  deleteCookie(c, 'user_info', { path: '/' });

  const logoutUrl = await getLogoutUrl(idToken);

  return c.json({ success: true, logoutUrl });
});
