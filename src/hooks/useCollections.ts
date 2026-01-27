import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCollections } from '~/server/functions/collections';

export const useCollections = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['collections', limit, offset],
    queryFn: () => getCollections({ data: { limit, offset } }),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
