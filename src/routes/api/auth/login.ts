import { createFileRoute } from '@tanstack/react-router';
import { config } from '~/server/services/config';
import { type CookieOptions, serializeCookie } from '~/server/services/cookies';
import { generateState, getAuthorizationUrl } from '~/server/services/oidc';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 600,
};

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async () => {
        const state = generateState();
        const authUrl = await getAuthorizationUrl(state);

        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl,
            'Set-Cookie': serializeCookie('oauth_state', state, cookieOptions),
          },
        });
      },
    },
  },
});
