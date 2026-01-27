export type SearchRequest = {
  searchType: 'basic' | 'advanced';
  query: string;
  filters?: Record<string, unknown> | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  sort?: 'id' | 'name' | 'createdAt' | 'updatedAt' | undefined;
  order?: 'asc' | 'desc' | undefined;
};

export type SearchEntity = {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  memberOf?: string;
  rootCollection?: string;
  access: { metadata: boolean; content: boolean };
  searchExtra: { score: number; highlight: Record<string, string[]> };
};

// biome-ignore lint/suspicious/noExplicitAny: API returns dynamic facet structure
export type Facets = Record<string, any>;

export type SearchResponse = {
  total: number;
  searchTime: number;
  entities: SearchEntity[];
  facets?: Facets | undefined;
};
