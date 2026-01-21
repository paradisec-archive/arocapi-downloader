import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { ExportJobMessage } from '@shared/types/index.js';
import { config } from './config.ts';

const sqsClient = new SQSClient({ region: config.AWS_REGION });

export const sendExportJob = async (job: ExportJobMessage): Promise<string> => {
  const command = new SendMessageCommand({
    QueueUrl: config.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(job),
    MessageGroupId: 'export-jobs',
  });

  const result = await sqsClient.send(command);

  if (!result.MessageId) {
    throw new Error('Failed to send message to SQS');
  }

  return result.MessageId;
};
