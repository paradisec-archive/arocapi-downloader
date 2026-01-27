import { createFileRoute, redirect } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { getAuthStatus } from '~/server/functions/auth';

const HomePage = () => {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">RO-Crate Downloader</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Browse and download files from RO-Crate collections. Select the files you need and receive a download link via email.
      </p>
      <Button size="lg" onClick={handleLogin}>
        Sign in to get started
      </Button>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: HomePage,
  beforeLoad: async () => {
    const auth = await getAuthStatus();

    if (auth.authenticated) {
      throw redirect({ to: '/browser' });
    }
  },
});
