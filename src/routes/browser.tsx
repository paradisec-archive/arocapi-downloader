import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CollectionList } from '~/components/browser/CollectionList';
import { SelectionSummary } from '~/components/browser/SelectionSummary';
import { getAuthStatus } from '~/server/functions/auth';

const browserSearchSchema = z.object({
  page: z.number().int().positive().optional().default(1),
});

export const Route = createFileRoute('/browser')({
  validateSearch: browserSearchSchema,
  beforeLoad: async () => {
    const auth = await getAuthStatus();

    if (!auth.authenticated) {
      throw redirect({ to: '/' });
    }

    return { user: auth.user };
  },
  component: BrowserPage,
});

function BrowserPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { page } = Route.useSearch();

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/browser',
      search: { page: newPage },
    });
  };

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
