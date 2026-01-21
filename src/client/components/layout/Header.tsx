import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold">
          RO-Crate Downloader
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated && (
            <Link
              to="/browser"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse
            </Link>
          )}

          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.name || user.email || user.sub}
              </span>
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
