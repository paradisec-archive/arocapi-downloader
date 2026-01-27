import { createFileRoute } from '@tanstack/react-router';
import { getCookieFromRequest, serializeCookie } from '~/server/services/cookies';
import { getLogoutUrl } from '~/server/services/oidc';

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const idToken = getCookieFromRequest(request, 'id_token');
        const logoutUrl = await getLogoutUrl(idToken);

        const cookies = [
          serializeCookie('access_token', '', { path: '/', maxAge: 0 }),
          serializeCookie('id_token', '', { path: '/', maxAge: 0 }),
          serializeCookie('user_info', '', { path: '/', maxAge: 0 }),
        ];

        const headers = new Headers();
        headers.set('Location', logoutUrl);
        for (const cookie of cookies) {
          headers.append('Set-Cookie', cookie);
        }

        return new Response(null, {
          status: 302,
          headers,
        });
      },
    },
  },
});
