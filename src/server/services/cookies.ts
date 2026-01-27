import { getRequest, setResponseHeader } from '@tanstack/react-start/server';

type CookieOptions = {
  httpOnly?: boolean | undefined;
  secure?: boolean | undefined;
  sameSite?: 'strict' | 'lax' | 'none' | undefined;
  path?: string | undefined;
  maxAge?: number | undefined;
  domain?: string | undefined;
};

/**
 * Parse cookies from a Cookie header string
 */
export const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
};

/**
 * Serialize a cookie to a Set-Cookie header value
 */
export const serializeCookie = (name: string, value: string, options: CookieOptions = {}): string => {
  const parts: string[] = [`${name}=${value}`];

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.secure) {
    parts.push('Secure');
  }
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`);
  }

  return parts.join('; ');
};

/**
 * Get a cookie value from the current request (for use in server functions)
 */
export const getCookie = (name: string): string | undefined => {
  const request = getRequest();
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);

  return cookies[name];
};

/**
 * Get a cookie value from a Request object (for use in server route handlers)
 */
export const getCookieFromRequest = (request: Request, name: string): string | undefined => {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);

  return cookies[name];
};

/**
 * Set a cookie in the response (for use in server functions)
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  setResponseHeader('Set-Cookie', serializeCookie(name, value, options));
};

/**
 * Delete a cookie by setting it to expire immediately (for use in server functions)
 */
export const deleteCookie = (name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void => {
  setCookie(name, '', { ...options, maxAge: 0 });
};

export type { CookieOptions };
