import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '~/server/services/config';
import { PRESIGNED_URL_EXPIRY_SECONDS } from '~/shared/constants';

const s3Client = new S3Client({ region: config.AWS_REGION });

type UploadProgressCallback = (bytesLoaded: number, bytesTotal: number) => void;

export const uploadToS3 = async (filePath: string, key: string, onProgress?: UploadProgressCallback): Promise<void> => {
  const fileStats = await stat(filePath);
  const fileStream = createReadStream(filePath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: 'application/zip',
    },
  });

  if (onProgress) {
    upload.on('httpUploadProgress', (progress) => {
      onProgress(progress.loaded ?? 0, fileStats.size);
    });
  }

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
