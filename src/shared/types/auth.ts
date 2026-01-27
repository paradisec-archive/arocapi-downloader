export type AuthUser = {
  sub: string;
  email?: string | undefined;
  name?: string | undefined;
};

export type AuthStatus = {
  authenticated: boolean;
  user?: AuthUser | undefined;
};
