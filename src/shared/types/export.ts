import type { RoCrateFile } from './file';

export type ExportFileInfo = Pick<RoCrateFile, 'id' | 'filename' | 'size' | 'memberOf'>;

export type JobPhase = 'grouping' | 'downloading' | 'zipping' | 'uploading' | 'emailing' | 'complete' | 'failed';

export type JobStatus = {
  jobId: string;
  phase: JobPhase;
  totalFiles: number;
  downloadedFiles: number;
  failedFiles: Array<{ filename: string; error: string }>;
  totalSize: number;
  downloadUrl?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  zipBytesProcessed: number;
  zipBytesTotal: number;
  uploadBytesLoaded: number;
  uploadBytesTotal: number;
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number };
  disk: { workDirSizeMB: number; tmpFreeSpaceMB: number };
};

export type ExportJobMessage = {
  jobId: string;
  files: ExportFileInfo[];
  email: string;
  accessToken: string;
  requestedAt: string;
};
