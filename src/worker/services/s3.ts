import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PRESIGNED_URL_EXPIRY_SECONDS } from '../../shared/constants.ts';
import { config } from './config.ts';

const s3Client = new S3Client({ region: config.AWS_REGION });

export const uploadToS3 = async (filePath: string, key: string): Promise<void> => {
  const fileStats = await stat(filePath);
  const fileStream = createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
    Body: fileStream,
    ContentLength: fileStats.size,
    ContentType: 'application/zip',
  });

  await s3Client.send(command);
};

export const generatePresignedUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });
};
