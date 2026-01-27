import type { RoCrateFile } from './file';

export type ExportFileInfo = Pick<RoCrateFile, 'id' | 'filename' | 'size' | 'memberOf'>;

export type ExportJobMessage = {
  jobId: string;
  files: ExportFileInfo[];
  email: string;
  accessToken: string;
  requestedAt: string;
};
