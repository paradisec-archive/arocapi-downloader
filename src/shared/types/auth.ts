export type AuthUser = {
  sub: string;
  email?: string;
  name?: string;
};

export type AuthStatus = {
  authenticated: boolean;
  user?: AuthUser;
};
