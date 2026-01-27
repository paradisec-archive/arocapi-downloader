import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItemsInCollection } from '~/server/functions/collections';
import { useSelectionStore } from '~/store/selectionStore';

export const useItems = (collectionId: string, enabled = true, limit = 50, offset = 0) => {
  const { registerItemsForCollection } = useSelectionStore();

  const query = useQuery({
    queryKey: ['items', collectionId, limit, offset],
    queryFn: () => getItemsInCollection({ data: { collectionId, limit, offset } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!collectionId,
  });

  useEffect(() => {
    if (query.data?.entities) {
      registerItemsForCollection(collectionId, query.data.entities);
    }
  }, [query.data, collectionId, registerItemsForCollection]);

  return query;
};
