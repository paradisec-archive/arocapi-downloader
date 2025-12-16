import type { ExportJobMessage } from '@shared/types/index.js'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../app.js'
import { sendExportJob } from '../services/sqs.ts'

export const exportRoutes = new Hono<AppEnv>()

const exportRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, 'At least one file must be selected'),
  email: z.string().email('Valid email required'),
  qualityPreferences: z.object({
    audio: z.enum(['archival', 'presentation']),
    video: z.enum(['archival', 'presentation']),
  }),
})

exportRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const result = exportRequestSchema.safeParse(body)

    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        400
      )
    }

    const { fileIds, email } = result.data

    const jobId = crypto.randomUUID()
    const job: ExportJobMessage = {
      jobId,
      fileIds,
      email,
      requestedAt: new Date().toISOString(),
    }

    await sendExportJob(job)

    return c.json({
      success: true,
      jobId,
      message: `Export request submitted. You will receive an email at ${email} when your download is ready.`,
    })
  } catch (error) {
    console.error('Error submitting export request:', error)

    return c.json({ error: 'Failed to submit export request' }, 500)
  }
})
