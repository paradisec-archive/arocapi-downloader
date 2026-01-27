import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '~/server/services/config';

const sesClient = new SESClient({ region: config.AWS_REGION });

type SendDownloadEmailParams = {
  to: string;
  downloadUrl: string;
  fileCount: number;
  totalSize: string;
};

export const sendDownloadEmail = async ({ to, downloadUrl, fileCount, totalSize }: SendDownloadEmailParams): Promise<void> => {
  const command = new SendEmailCommand({
    Source: config.EMAIL_FROM,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: 'Your RO-Crate download is ready',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <h1 style="color: #2563eb;">Your Download is Ready</h1>

  <p>Your requested download containing <strong>${fileCount} file${fileCount !== 1 ? 's' : ''}</strong> (${totalSize}) is ready.</p>

  <p style="margin: 24px 0;">
    <a href="${downloadUrl}"
       style="background-color: #2563eb; color: white; padding: 12px 24px;
              text-decoration: none; border-radius: 6px; display: inline-block;">
      Download Files
    </a>
  </p>

  <p style="color: #666; font-size: 14px;">
    This link will expire in 24 hours. If you need to download the files again
    after the link expires, please submit a new export request.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

  <p style="color: #999; font-size: 12px;">
    RO-Crate Downloader
  </p>
</body>
</html>
          `.trim(),
          Charset: 'UTF-8',
        },
        Text: {
          Data: `
Your Download is Ready

Your requested download containing ${fileCount} file${fileCount !== 1 ? 's' : ''} (${totalSize}) is ready.

Download link: ${downloadUrl}

This link will expire in 24 hours.
          `.trim(),
          Charset: 'UTF-8',
        },
      },
    },
  });

  await sesClient.send(command);
};
