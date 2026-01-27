import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { getItemsInCollection } from '~/server/functions/collections';
import { getItem } from '~/server/functions/items';
import { registerItemsForCollectionAtom } from '~/store/selectionStore';

export const useItems = (collectionId: string, enabled = true, limit = 50, offset = 0) => {
  const registerItemsForCollection = useSetAtom(registerItemsForCollectionAtom);

  const query = useQuery({
    queryKey: ['items', collectionId, limit, offset],
    queryFn: () => getItemsInCollection({ data: { collectionId, limit, offset } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!collectionId,
  });

  useEffect(() => {
    if (query.data?.entities) {
      registerItemsForCollection({ collectionId, items: query.data.entities });
    }
  }, [query.data, collectionId, registerItemsForCollection]);

  return query;
};

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem({ data: { id } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
