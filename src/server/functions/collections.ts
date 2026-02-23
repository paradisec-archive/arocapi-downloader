import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import * as rocrate from '~/server/services/rocrate';
import type { Entity, PaginatedEntitiesResponse } from '~/shared/types/index';

const collectionItemsSchema = z.object({
  collectionId: z.string().min(1),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const getItemsInCollection = createServerFn({ method: 'GET' })
  .inputValidator(collectionItemsSchema)
  .handler(async ({ data }): Promise<PaginatedEntitiesResponse<Entity>> => {
    const token = getCookie('access_token');

    return rocrate.getItemsInCollection(data.collectionId, data.limit ?? 50, data.offset ?? 0, token);
  });
