export type PaginatedEntitiesResponse<T> = {
  entities: T[];
  total: number;
  limit: number;
  offset: number;
};

export type PaginatedFilesResponse<T> = {
  files: T[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
