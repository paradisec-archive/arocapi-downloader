import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  ROCRATE_API_BASE_URL: z.string().url(),

  AWS_REGION: z.string().default('ap-southeast-2'),
  SQS_QUEUE_URL: z.string().url(),
  S3_BUCKET: z.string().min(1),
  EMAIL_FROM: z.string().email(),
});

export type WorkerEnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): WorkerEnvConfig => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Worker environment validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const config = parseEnv();
