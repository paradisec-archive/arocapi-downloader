import { createFileRoute } from '@tanstack/react-router';
import { config } from '~/server/services/config';
import { type CookieOptions, getCookieFromRequest, serializeCookie } from '~/server/services/cookies';
import { exchangeCodeForTokens, getUserInfo, type UserInfo, verifyIdToken } from '~/server/services/oidc';

const createCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (error) {
          console.error('OIDC error:', error, errorDescription);

          return new Response(null, {
            status: 302,
            headers: {
              Location: `/?error=${encodeURIComponent(errorDescription || error)}`,
            },
          });
        }

        if (!code) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/?error=No%20authorization%20code%20received',
            },
          });
        }

        const savedState = getCookieFromRequest(request, 'oauth_state');

        if (!savedState || savedState !== state) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/?error=Invalid%20state%20parameter',
            },
          });
        }

        try {
          const tokens = await exchangeCodeForTokens(code);

          let user: UserInfo;
          if (tokens.id_token) {
            user = await verifyIdToken(tokens.id_token);
          } else {
            user = await getUserInfo(tokens.access_token);
          }

          const maxAge = tokens.expires_in || 3600;
          const cookieOptions = createCookieOptions(maxAge);

          const cookies: string[] = [
            serializeCookie('oauth_state', '', { path: '/', maxAge: 0 }),
            serializeCookie('access_token', tokens.access_token, cookieOptions),
            serializeCookie('user_info', JSON.stringify(user), cookieOptions),
          ];

          if (tokens.id_token) {
            cookies.push(serializeCookie('id_token', tokens.id_token, cookieOptions));
          }

          const headers = new Headers();
          headers.set('Location', `${import.meta.env.BASE_URL}browser`);
          for (const cookie of cookies) {
            headers.append('Set-Cookie', cookie);
          }

          return new Response(null, {
            status: 302,
            headers,
          });
        } catch (err) {
          console.error('Token exchange error:', err);

          return new Response(null, {
            status: 302,
            headers: {
              Location: '/?error=Authentication%20failed',
            },
          });
        }
      },
    },
  },
});
