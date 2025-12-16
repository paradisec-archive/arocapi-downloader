import type { QualityTier } from './file.js'

export type QualityPreferences = {
  audio: QualityTier
  video: QualityTier
}

export type ExportRequest = {
  fileIds: string[]
  email: string
  qualityPreferences: QualityPreferences
}

export type ExportJob = {
  id: string
  fileIds: string[]
  email: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  totalSize: number
}

export type ExportJobMessage = {
  jobId: string
  fileIds: string[]
  email: string
  requestedAt: string
}
