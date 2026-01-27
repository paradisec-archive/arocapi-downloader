import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { getFile, getFilesInItem } from '~/server/functions/items';
import { addFileMetadataAtom, registerFilesForItemAtom } from '~/store/selectionStore';

export const useFiles = (itemId: string, enabled = true, limit = 100, offset = 0) => {
  const addFileMetadata = useSetAtom(addFileMetadataAtom);
  const registerFilesForItem = useSetAtom(registerFilesForItemAtom);

  const query = useQuery({
    queryKey: ['files', itemId, limit, offset],
    queryFn: () => getFilesInItem({ data: { itemId, limit, offset } }),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!itemId,
  });

  useEffect(() => {
    if (query.data?.files) {
      addFileMetadata(query.data.files);
      registerFilesForItem({ itemId, files: query.data.files });
    }
  }, [query.data, itemId, addFileMetadata, registerFilesForItem]);

  return query;
};

export const useFile = (id: string) => {
  return useQuery({
    queryKey: ['file', id],
    queryFn: () => getFile({ data: { id } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
