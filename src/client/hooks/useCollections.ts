import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useCollections = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ['collections', limit, offset],
    queryFn: () => api.getCollections(limit, offset),
    staleTime: 5 * 60 * 1000,
  })
}

export const useCollection = (id: string) => {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.getCollection(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}
