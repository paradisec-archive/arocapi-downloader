import { z } from 'zod'

export const qualityTierSchema = z.enum(['archival', 'presentation'])

export const fileTypeSchema = z.enum(['audio', 'video', 'other'])

export const fileAccessSchema = z.object({
  content: z.boolean(),
})

export const roCrateFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mediaType: z.string(),
  size: z.number().nonnegative(),
  memberOf: z.string(),
  access: fileAccessSchema.optional(),
})

export const fileWithQualitySchema = roCrateFileSchema.extend({
  qualityTier: qualityTierSchema,
  fileType: fileTypeSchema,
})

export type QualityTierSchema = z.infer<typeof qualityTierSchema>
export type FileTypeSchema = z.infer<typeof fileTypeSchema>
export type RoCrateFileSchema = z.infer<typeof roCrateFileSchema>
export type FileWithQualitySchema = z.infer<typeof fileWithQualitySchema>
