import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getCookie } from '~/server/services/cookies';
import type { ExportJobMessage, JobStatus } from '~/shared/types/index';
import { failJob, getJobStatus as getJobStatusFromStore, initJob } from '~/worker/jobStore';
import { processJob } from '~/worker/processor';

const exportFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  size: z.number(),
  memberOf: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

const exportRequestSchema = z.object({
  files: z.array(exportFileSchema).min(1, 'At least one file must be selected'),
  email: z.email('Valid email required'),
});

type ExportResponse = {
  success: boolean;
  jobId?: string;
  message: string;
  error?: string;
};

export const submitExport = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => exportRequestSchema.parse(data))
  .handler(async ({ data }): Promise<ExportResponse> => {
    const accessToken = getCookie('access_token');

    if (!accessToken) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No access token available',
      };
    }

    const jobId = crypto.randomUUID();
    const totalSize = data.files.reduce((sum, f) => sum + f.size, 0);
    initJob(jobId, data.files.length, totalSize);

    const job: ExportJobMessage = {
      jobId,
      files: data.files,
      email: data.email,
      accessToken,
      requestedAt: new Date().toISOString(),
    };

    // Run in background - don't await
    processJob(job).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Export job ${jobId} failed:`, error);
      failJob(jobId, message);
    });

    return {
      success: true,
      jobId,
      message: `Export request submitted. You will receive an email at ${data.email} when your download is ready.`,
    };
  });

export const getJobStatus = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ jobId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<JobStatus | null> => {
    return getJobStatusFromStore(data.jobId);
  });
