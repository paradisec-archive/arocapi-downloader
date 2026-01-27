import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getFilesInItem } from '~/server/functions/items';
import { useSelectionStore } from '~/store/selectionStore';

export const useFiles = (itemId: string, enabled = true, limit = 100, offset = 0) => {
  const { addFileMetadata, registerFilesForItem } = useSelectionStore();

  const query = useQuery({
    queryKey: ['files', itemId, limit, offset],
    queryFn: () => getFilesInItem({ data: { itemId, limit, offset } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!itemId,
  });

  useEffect(() => {
    if (query.data?.files) {
      addFileMetadata(query.data.files);
      registerFilesForItem(itemId, query.data.files);
    }
  }, [query.data, itemId, addFileMetadata, registerFilesForItem]);

  return query;
};
