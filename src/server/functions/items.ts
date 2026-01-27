import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import * as rocrate from '~/server/services/rocrate';
import type { PaginatedFilesResponse, RoCrateFile } from '~/shared/types/index';

const itemFilesSchema = z.object({
  itemId: z.string().min(1),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const getFilesInItem = createServerFn({ method: 'GET' })
  .inputValidator(itemFilesSchema)
  .handler(async ({ data }): Promise<PaginatedFilesResponse<RoCrateFile>> => {
    const token = getCookie('access_token');

    return rocrate.getFilesInItem(data.itemId, data.limit ?? 100, data.offset ?? 0, token);
  });
