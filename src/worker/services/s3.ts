import type { Readable } from 'node:stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '~/server/services/config';
import { PRESIGNED_URL_EXPIRY_SECONDS } from '~/shared/constants';

const s3Client = new S3Client({ region: config.AWS_REGION });

export const uploadStreamToS3 = async (stream: Readable, key: string): Promise<void> => {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: stream,
      ContentType: 'application/zip',
    },
  });

  await upload.done();
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
