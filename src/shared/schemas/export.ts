import { z } from 'zod'
import { qualityTierSchema } from './file.js'

export const qualityPreferencesSchema = z.object({
  audio: qualityTierSchema,
  video: qualityTierSchema,
})

export const exportRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, 'At least one file must be selected'),
  email: z.string().email('Valid email required'),
  qualityPreferences: qualityPreferencesSchema,
})

export const exportJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])

export const exportJobSchema = z.object({
  id: z.string(),
  fileIds: z.array(z.string()),
  email: z.string().email(),
  status: exportJobStatusSchema,
  createdAt: z.string(),
  totalSize: z.number(),
})

export const exportJobMessageSchema = z.object({
  jobId: z.string(),
  fileIds: z.array(z.string()),
  email: z.string().email(),
  requestedAt: z.string(),
})

export type QualityPreferencesSchema = z.infer<typeof qualityPreferencesSchema>
export type ExportRequestSchema = z.infer<typeof exportRequestSchema>
export type ExportJobStatusSchema = z.infer<typeof exportJobStatusSchema>
export type ExportJobSchema = z.infer<typeof exportJobSchema>
export type ExportJobMessageSchema = z.infer<typeof exportJobMessageSchema>
