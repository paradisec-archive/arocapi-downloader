import { z } from 'zod';
import { entityRefSchema } from './file.js';

export const entityTypeSchema = z.enum(['RepositoryCollection', 'RepositoryItem', 'Object']);

export const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  entityType: entityTypeSchema,
  memberOf: entityRefSchema.optional(),
  rootCollection: z.string().optional(),
  licenses: z.array(z.string()).optional(),
});

export const collectionSchema = entitySchema.extend({
  entityType: z.literal('http://pcdm.org/models#Collection'),
});

export const itemSchema = entitySchema.extend({
  entityType: z.literal('http://pcdm.org/models#Object'),
  memberOf: entityRefSchema,
});

export type EntitySchema = z.infer<typeof entitySchema>;
export type CollectionSchema = z.infer<typeof collectionSchema>;
export type ItemSchema = z.infer<typeof itemSchema>;
