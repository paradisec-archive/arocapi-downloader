import type { Entity, RoCrateFile, PaginatedResponse, ExportRequest } from '@shared/types/index'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.message || `Request failed: ${response.statusText}`,
      response.status,
      error.details
    )
  }

  return response.json() as Promise<T>
}

export const api = {
  getCollections: (page = 1, pageSize = 50): Promise<PaginatedResponse<Entity>> => {
    return fetchApi(`/collections?page=${page}&pageSize=${pageSize}`)
  },

  getCollection: (id: string): Promise<Entity> => {
    return fetchApi(`/collections/${encodeURIComponent(id)}`)
  },

  getItems: (collectionId: string, page = 1, pageSize = 50): Promise<PaginatedResponse<Entity>> => {
    return fetchApi(
      `/collections/${encodeURIComponent(collectionId)}/items?page=${page}&pageSize=${pageSize}`
    )
  },

  getItem: (id: string): Promise<Entity> => {
    return fetchApi(`/items/${encodeURIComponent(id)}`)
  },

  getFiles: (itemId: string, page = 1, pageSize = 100): Promise<PaginatedResponse<RoCrateFile>> => {
    return fetchApi(`/items/${encodeURIComponent(itemId)}/files?page=${page}&pageSize=${pageSize}`)
  },

  getFile: (id: string): Promise<RoCrateFile> => {
    return fetchApi(`/files/${encodeURIComponent(id)}`)
  },

  submitExport: (
    request: ExportRequest
  ): Promise<{ success: boolean; jobId: string; message: string }> => {
    return fetchApi('/export', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  getAuthStatus: (): Promise<{
    authenticated: boolean
    user?: { sub: string; email?: string; name?: string }
  }> => {
    return fetch('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .catch(() => ({ authenticated: false }))
  },
}

export { ApiError }
