import type { AuthStatus } from '@shared/types/auth';
import type { Entity, ExportRequest, PaginatedResponse, RoCrateFile } from '@shared/types/index';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
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
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || `Request failed: ${response.statusText}`,
      response.status,
      error.details,
    );
  }

  return response.json() as Promise<T>;
};

export const api = {
  getCollections: (limit = 50, offset = 0): Promise<PaginatedResponse<Entity>> => {
    return fetchApi(`/collections?limit=${limit}&offset=${offset}`);
  },

  getCollection: (id: string): Promise<Entity> => {
    return fetchApi(`/collections/${encodeURIComponent(id)}`);
  },

  getItems: (collectionId: string, limit = 50, offset = 0): Promise<PaginatedResponse<Entity>> => {
    return fetchApi(
      `/collections/${encodeURIComponent(collectionId)}/items?limit=${limit}&offset=${offset}`,
    );
  },

  getItem: (id: string): Promise<Entity> => {
    return fetchApi(`/items/${encodeURIComponent(id)}`);
  },

  getFiles: (itemId: string, limit = 100, offset = 0): Promise<PaginatedResponse<RoCrateFile>> => {
    return fetchApi(`/items/${encodeURIComponent(itemId)}/files?limit=${limit}&offset=${offset}`);
  },

  getFile: (id: string): Promise<RoCrateFile> => {
    return fetchApi(`/files/${encodeURIComponent(id)}`);
  },

  submitExport: (
    request: ExportRequest,
  ): Promise<{ success: boolean; jobId: string; message: string }> => {
    return fetchApi('/export', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  getAuthStatus: (): Promise<AuthStatus> => {
    return fetch('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .catch(() => ({ authenticated: false }));
  },
};

export { ApiError };
