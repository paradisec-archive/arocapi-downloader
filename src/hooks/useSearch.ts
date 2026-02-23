import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchEntities } from '~/server/functions/search';
import type { FacetFilters } from '~/shared/types/search';

type UseSearchOptions = {
  query: string;
  filters?: FacetFilters | undefined;
  limit?: number;
  offset?: number;
  enabled?: boolean;
};

export const useSearch = ({ query, filters, limit = 50, offset = 0, enabled = true }: UseSearchOptions) => {
  return useQuery({
    queryKey: ['search', query, filters, limit, offset],
    queryFn: () => searchEntities({ data: { query, filters, limit, offset } }),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  });
};
