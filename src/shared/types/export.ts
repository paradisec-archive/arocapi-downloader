import type { QualityTier, RoCrateFile } from './file.js';

export type QualityPreferences = {
  audio: QualityTier;
  video: QualityTier;
};

export type ExportFileInfo = Pick<RoCrateFile, 'id' | 'name' | 'size' | 'memberOf'>;

export type ExportRequest = {
  files: ExportFileInfo[];
  email: string;
  qualityPreferences: QualityPreferences;
};

export type ExportJob = {
  id: string;
  files: ExportFileInfo[];
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  totalSize: number;
};

export type ExportJobMessage = {
  jobId: string;
  files: ExportFileInfo[];
  email: string;
  accessToken: string;
  requestedAt: string;
};
