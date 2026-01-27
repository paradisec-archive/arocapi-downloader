import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCollection, getCollections } from '~/server/functions/collections';

export const useCollections = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['collections', limit, offset],
    queryFn: () => getCollections({ data: { limit, offset } }),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useCollection = (id: string) => {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => getCollection({ data: { id } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
