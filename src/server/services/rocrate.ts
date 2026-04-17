import type { Entity, PaginatedEntitiesResponse, PaginatedFilesResponse, RoCrateFile, SearchRequest, SearchResponse } from '#/shared/types/index.ts';
import { config } from './config.ts';

const baseUrl = config.ROCRATE_API_BASE_URL;

type FetchOptions = {
  params?: Record<string, string | number | undefined> | undefined;
  token?: string | undefined;
};

const fetchFromApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${basePath}${endpointPath}`, base.origin);

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

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`RO-Crate API error: ${response.status} ${response.statusText} ${await response.text()}`);
  }

  const data = response.json() as Promise<T>;

  return data;
};

type PostOptions = {
  body: Record<string, unknown>;
  token?: string | undefined;
};

const postToApi = async <T>(endpoint: string, options: PostOptions): Promise<T> => {
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${basePath}${endpointPath}`, base.origin);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(`RO-Crate API error: ${response.status} ${response.statusText} ${await response.text()}`);
  }

  const data = response.json() as Promise<T>;

  return data;
};

const PAGE_SIZE = 500;

const fetchAllPages = async <TPage extends { total: number }, TItem>(
  endpoint: string,
  extractItems: (page: TPage) => TItem[],
  params: Record<string, string | number | undefined>,
  token?: string,
): Promise<TItem[]> => {
  const all: TItem[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchFromApi<TPage>(endpoint, {
      params: { ...params, limit: PAGE_SIZE, offset },
      token,
    });

    const items = extractItems(page);
    all.push(...items);
    if (items.length === 0 || all.length >= page.total) break;
    offset += items.length;
  }

  return all;
};

export const getItemsInCollection = (collectionId: string, token?: string): Promise<Entity[]> =>
  fetchAllPages<PaginatedEntitiesResponse<Entity>, Entity>(
    '/entities',
    (page) => page.entities,
    { memberOf: collectionId, entityType: 'http://pcdm.org/models#Object' },
    token,
  );

export const getFilesInItem = (itemId: string, token?: string): Promise<RoCrateFile[]> =>
  fetchAllPages<PaginatedFilesResponse<RoCrateFile>, RoCrateFile>('/files', (page) => page.files, { memberOf: itemId }, token);

export const getEntity = async (id: string, token?: string): Promise<Entity> => {
  return fetchFromApi<Entity>(`/entity/${encodeURIComponent(id)}`, { token });
};

export const search = async (request: SearchRequest, token?: string): Promise<SearchResponse> => {
  return postToApi<SearchResponse>('/search', {
    body: request as unknown as Record<string, unknown>,
    token,
  });
};
