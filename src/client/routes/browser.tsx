import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';
import { CollectionList } from '@/components/browser/CollectionList';
import { SelectionSummary } from '@/components/browser/SelectionSummary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const browserSearchSchema = z.object({
  page: z.number().int().positive().catch(1),
});

export const Route = createFileRoute('/browser')({
  component: BrowserPage,
  validateSearch: browserSearchSchema,
});

function BrowserPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { page } = Route.useSearch();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/browser',
      search: { page: newPage },
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Browse Collections</h1>
      </div>

      <CollectionList page={page} onPageChange={handlePageChange} />

      <SelectionSummary userEmail={user?.email} />
    </div>
  );
}
