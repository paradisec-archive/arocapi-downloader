import { Link, useRouterState } from '@tanstack/react-router';
import { SearchBar } from '~/components/search/SearchBar';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/hooks/useAuth';

export const Header = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const routerState = useRouterState();

  // Extract search query from URL if on browser page
  const searchParams = routerState.location.search;
  const currentQuery = searchParams.q || '';

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-semibold">
            RO-Crate Downloader
          </Link>
          {isAuthenticated && <SearchBar initialQuery={currentQuery} />}
        </div>
        <nav className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.name || user.email || user.sub}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={login}>
              Sign in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
