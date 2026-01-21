import type { Entity, PaginatedEntitiesResponse, RoCrateFile } from '../../shared/types/index.ts';
import { config } from './config.ts';

const baseUrl = config.ROCRATE_API_BASE_URL;

type FetchOptions = {
  params?: Record<string, string | number | undefined>;
  token?: string;
};

const fetchFromApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${basePath}${endpointPath}`, base.origin);
  console.log('🪚 url:', JSON.stringify(url, null, 2));

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  console.log('🪚 headers:', JSON.stringify(headers, null, 2));

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(
      `RO-Crate API error: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }

  const data = response.json() as Promise<T>;

  return data;
};

export const getCollections = async (
  limit = 50,
  offset = 0,
  token?: string,
): Promise<PaginatedEntitiesResponse<Entity>> => {
  return fetchFromApi<PaginatedEntitiesResponse<Entity>>('/entities', {
    params: {
      entityType: 'http://pcdm.org/models#Collection',
      limit,
      offset,
    },
    token,
  });
};

export const getCollection = async (id: string, token?: string): Promise<Entity> => {
  return fetchFromApi<Entity>(`/entity/${encodeURIComponent(id)}`, { token });
};

export const getItemsInCollection = async (
  collectionId: string,
  limit = 50,
  offset = 0,
  token?: string,
): Promise<PaginatedEntitiesResponse<Entity>> => {
  return fetchFromApi<PaginatedEntitiesResponse<Entity>>('/entities', {
    params: {
      memberOf: collectionId,
      entityType: 'http://pcdm.org/models#Object',
      limit,
      offset,
    },
    token,
  });
};

export const getItem = async (id: string, token?: string): Promise<Entity> => {
  return fetchFromApi<Entity>(`/entity/${encodeURIComponent(id)}`, { token });
};

export const getFilesInItem = async (
  itemId: string,
  limit = 100,
  offset = 0,
  token?: string,
): Promise<PaginatedEntitiesResponse<RoCrateFile>> => {
  return fetchFromApi<PaginatedEntitiesResponse<RoCrateFile>>('/files', {
    params: {
      memberOf: itemId,
      limit,
      offset,
    },
    token,
  });
};

export const getFile = async (id: string, token?: string): Promise<RoCrateFile> => {
  return fetchFromApi<RoCrateFile>(`/file/${encodeURIComponent(id)}`, { token });
};

export const downloadFile = async (id: string, token?: string): Promise<Response> => {
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  const url = new URL(`${basePath}/file/${encodeURIComponent(id)}`, base.origin);

  const headers: Record<string, string> = {
    Accept: '*/*',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url.toString(), { headers });
};
