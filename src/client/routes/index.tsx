import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/browser' });
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">RO-Crate Downloader</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Browse and download files from RO-Crate collections. Select the files you need and receive a
        download link via email.
      </p>
      <Button size="lg" onClick={login}>
        Sign in to get started
      </Button>
    </div>
  );
}
