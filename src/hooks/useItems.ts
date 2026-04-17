import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItemsInCollection } from '#/server/functions/collections.ts';
import { useSelectionStore } from '#/store/selectionStore.ts';

export const useItems = (collectionId: string, enabled = true) => {
  const { registerItemsForCollection } = useSelectionStore();

  const query = useQuery({
    queryKey: ['items', collectionId],
    queryFn: () => getItemsInCollection({ data: { collectionId } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!collectionId,
  });

  useEffect(() => {
    if (query.data) {
      registerItemsForCollection(collectionId, query.data);
    }
  }, [query.data, collectionId, registerItemsForCollection]);

  return query;
};
