import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { z } from 'zod';
import { SelectionSummary } from '~/components/browser/SelectionSummary';
import { SearchResults } from '~/components/search/SearchResults';
import { getAuthStatus } from '~/server/functions/auth';
import type { FacetFilters } from '~/shared/types/search';

const FACET_KEYS = ['collection_title', 'languages_with_code', 'countries', 'collector_name', 'full_identifier', 'entity_type'] as const;

const browserSearchSchema = z.object({
  q: z.string().min(1).optional(),
  page: z.number().int().positive().optional().default(1),
  collection_title: z.array(z.string()).optional(),
  languages_with_code: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  collector_name: z.array(z.string()).optional(),
  full_identifier: z.array(z.string()).optional(),
  entity_type: z.array(z.string()).optional(),
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
  const search = Route.useSearch();
  const { q = '', page } = search;

  const query = q;

  const filters = useMemo(() => {
    const result: FacetFilters = {};
    for (const key of FACET_KEYS) {
      const values = search[key];
      if (values && values.length > 0) {
        result[key] = values;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }, [search]);

  const buildSearchParams = (overrides: { page?: number; filters?: FacetFilters; q?: string }) => {
    const activeQuery = overrides.q ?? q;
    const activeFilters = overrides.filters ?? filters ?? {};
    const params: Record<string, string | number | string[] | undefined> = {
      q: activeQuery || undefined,
      page: overrides.page ?? page,
    };

    for (const key of FACET_KEYS) {
      const values = activeFilters[key];
      params[key] = values && values.length > 0 ? values : undefined;
    }

    return params;
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/browser',
      search: buildSearchParams({ page: newPage }),
    });
  };

  const handleFiltersChange = (newFilters: FacetFilters) => {
    navigate({
      to: '/browser',
      search: buildSearchParams({ page: 1, filters: newFilters }),
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{q ? 'Search Results' : 'Browse Collections'}</h1>
      </div>

      <SearchResults query={query} page={page} filters={filters} onPageChange={handlePageChange} onFiltersChange={handleFiltersChange} />

      <SelectionSummary userEmail={user?.email} />
    </div>
  );
}
