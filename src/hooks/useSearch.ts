import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchEntities } from '~/server/functions/search';

type UseSearchOptions = {
  query: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
};

export const useSearch = ({ query, limit = 50, offset = 0, enabled = true }: UseSearchOptions) => {
  return useQuery({
    queryKey: ['search', query, limit, offset],
    queryFn: () => searchEntities({ data: { query, limit, offset } }),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: enabled && query.length > 0,
  });
};
