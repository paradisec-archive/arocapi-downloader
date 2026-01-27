import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import * as rocrate from '~/server/services/rocrate';
import type { Entity, PaginatedFilesResponse, RoCrateFile } from '~/shared/types/index';

const idSchema = z.object({
  id: z.string().min(1),
});

const itemFilesSchema = z.object({
  itemId: z.string().min(1),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const getItem = createServerFn({ method: 'GET' })
  .inputValidator(idSchema)
  .handler(async ({ data }): Promise<Entity> => {
    const token = getCookie('access_token');

    return rocrate.getItem(data.id, token);
  });

export const getFilesInItem = createServerFn({ method: 'GET' })
  .inputValidator(itemFilesSchema)
  .handler(async ({ data }): Promise<PaginatedFilesResponse<RoCrateFile>> => {
    const token = getCookie('access_token');

    return rocrate.getFilesInItem(data.itemId, data.limit ?? 100, data.offset ?? 0, token);
  });

export const getFile = createServerFn({ method: 'GET' })
  .inputValidator(idSchema)
  .handler(async ({ data }): Promise<RoCrateFile> => {
    const token = getCookie('access_token');

    return rocrate.getFile(data.id, token);
  });
