import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getFilesInItem } from '#/server/functions/items.ts';
import { useSelectionStore } from '#/store/selectionStore.ts';

export const useFiles = (itemId: string, enabled = true) => {
  const { addFileMetadata, registerFilesForItem } = useSelectionStore();

  const query = useQuery({
    queryKey: ['files', itemId],
    queryFn: () => getFilesInItem({ data: { itemId } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!itemId,
  });

  useEffect(() => {
    if (query.data) {
      addFileMetadata(query.data);
      registerFilesForItem(itemId, query.data);
    }
  }, [query.data, itemId, addFileMetadata, registerFilesForItem]);

  return query;
};
