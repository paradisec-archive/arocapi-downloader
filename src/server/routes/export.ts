import type { ExportJobMessage } from '@shared/types/index.js';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { sendExportJob } from '../services/sqs.ts';

export const exportRoutes = new Hono<AppEnv>();

const exportFileSchema = z.object({
  id: z.string(),
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

exportRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = exportRequestSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: z.treeifyError(result.error),
        },
        400,
      );
    }

    const { files, email } = result.data;
    const accessToken = getCookie(c, 'access_token');

    if (!accessToken) {
      return c.json({ error: 'No access token available' }, 401);
    }

    const jobId = crypto.randomUUID();
    const job: ExportJobMessage = {
      jobId,
      files,
      email,
      accessToken,
      requestedAt: new Date().toISOString(),
    };

    await sendExportJob(job);

    return c.json({
      success: true,
      jobId,
      message: `Export request submitted. You will receive an email at ${email} when your download is ready.`,
    });
  } catch (error) {
    console.error('Error submitting export request:', error);

    return c.json({ error: 'Failed to submit export request' }, 500);
  }
});
