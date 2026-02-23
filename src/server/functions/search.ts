import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import * as rocrate from '~/server/services/rocrate';
import type { SearchRequest } from '~/shared/types/index';

const searchSchema = z.object({
  query: z.string(),
  filters: z.record(z.string(), z.array(z.string())).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  sort: z.enum(['id', 'name', 'createdAt', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const searchEntities = createServerFn({ method: 'POST' })
  .inputValidator(searchSchema)
  .handler(async ({ data }) => {
    const token = getCookie('access_token');

    const request: SearchRequest = {
      searchType: 'basic',
      query: data.query,
      limit: data.limit ?? 50,
      offset: data.offset ?? 0,
    };

    if (data.filters && Object.keys(data.filters).length > 0) {
      request.filters = data.filters;
    }

    if (data.sort) {
      request.sort = data.sort;
    }

    if (data.order) {
      request.order = data.order;
    }

    return rocrate.search(request, token);
  });
