import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import * as rocrate from '~/server/services/rocrate';
import type { Entity } from '~/shared/types/index';

const entitySchema = z.object({
  id: z.string().min(1),
});

export const getEntity = createServerFn({ method: 'GET' })
  .inputValidator(entitySchema)
  .handler(async ({ data }): Promise<Entity> => {
    const token = getCookie('access_token');

    return rocrate.getEntity(data.id, token);
  });
