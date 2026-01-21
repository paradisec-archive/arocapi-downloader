import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useSelectionStore } from '@/store/selectionStore';

export const useItems = (collectionId: string, enabled = true, limit = 50, offset = 0) => {
  const registerItemsForCollection = useSelectionStore((state) => state.registerItemsForCollection);

  const query = useQuery({
    queryKey: ['items', collectionId, limit, offset],
    queryFn: () => api.getItems(collectionId, limit, offset),
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

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => api.getItem(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
