import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import type { ExportJobMessage } from '@shared/types/index.ts'
import { processJob } from './processor.ts'
import { config } from './services/config.ts'

const sqsClient = new SQSClient({ region: config.AWS_REGION })

let isRunning = true

const gracefulShutdown = () => {
  console.log('Received shutdown signal, stopping worker...')
  isRunning = false
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

const processMessages = async (): Promise<void> => {
  console.log('Worker started, listening for messages...')

  while (isRunning) {
    try {
      const result = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: config.SQS_QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 600,
        })
      )

      if (!result.Messages || result.Messages.length === 0) {
        continue
      }

      for (const message of result.Messages) {
        if (!message.Body || !message.ReceiptHandle) {
          console.warn('Received message without body or receipt handle')
          continue
        }

        try {
          const job = JSON.parse(message.Body) as ExportJobMessage
          console.log(`Received job: ${job.jobId}`)

          await processJob(job)

          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: config.SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            })
          )

          console.log(`Deleted message for job: ${job.jobId}`)
        } catch (error) {
          console.error('Error processing message:', error)
        }
      }
    } catch (error) {
      console.error('Error receiving messages:', error)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  console.log('Worker stopped')
}

processMessages().catch((error) => {
  console.error('Worker crashed:', error)
  process.exit(1)
})
