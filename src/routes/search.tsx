import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { SelectionSummary } from '~/components/browser/SelectionSummary';
import { SearchResults } from '~/components/search/SearchResults';
import { getAuthStatus } from '~/server/functions/auth';

const searchSearchSchema = z.object({
  q: z.string().min(1),
  page: z.number().int().positive().optional().default(1),
});

export const Route = createFileRoute('/search')({
  validateSearch: searchSearchSchema,
  beforeLoad: async () => {
    const auth = await getAuthStatus();

    if (!auth.authenticated) {
      throw redirect({ to: '/' });
    }

    return { user: auth.user };
  },
  component: SearchPage,
});

function SearchPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { q, page } = Route.useSearch();

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/search',
      search: { q, page: newPage },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Search Results</h1>
      </div>

      <SearchResults query={q} page={page} onPageChange={handlePageChange} />

      <SelectionSummary userEmail={user?.email} />
    </div>
  );
}
