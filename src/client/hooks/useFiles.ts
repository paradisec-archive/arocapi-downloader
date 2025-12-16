import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useSelectionStore } from '@/store/selectionStore'

export const useFiles = (itemId: string, enabled = true, limit = 100, offset = 0) => {
  const addFileMetadata = useSelectionStore((state) => state.addFileMetadata)
  const registerFilesForItem = useSelectionStore((state) => state.registerFilesForItem)

  const query = useQuery({
    queryKey: ['files', itemId, limit, offset],
    queryFn: () => api.getFiles(itemId, limit, offset),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!itemId,
  })

  useEffect(() => {
    if (query.data?.files) {
      addFileMetadata(query.data.files)
      registerFilesForItem(itemId, query.data.files)
    }
  }, [query.data, itemId, addFileMetadata, registerFilesForItem])

  return query
}

export const useFile = (id: string) => {
  return useQuery({
    queryKey: ['file', id],
    queryFn: () => api.getFile(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}
