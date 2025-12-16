import { formatFileSize } from '../shared/formatters.ts'
import type { ExportJobMessage } from '../shared/types/index.ts'
import { sendDownloadEmail } from './services/email.ts'
import { downloadFileWithMetadata } from './services/rocrate.ts'
import { generatePresignedUrl, uploadToS3 } from './services/s3.ts'
import { cleanupWorkDir, createWorkDir, createZipArchive } from './services/zipper.ts'

export const processJob = async (job: ExportJobMessage): Promise<void> => {
  const { jobId, fileIds, email } = job

  console.log(`Processing job ${jobId}: ${fileIds.length} files for ${email}`)

  const workDir = await createWorkDir(jobId)

  try {
    let totalSize = 0

    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i]
      console.log(`Downloading file ${i + 1}/${fileIds.length}: ${fileId}`)

      try {
        const { metadata } = await downloadFileWithMetadata(fileId, workDir)
        totalSize += metadata.size
      } catch (error) {
        console.error(`Failed to download file ${fileId}:`, error)
        throw error
      }
    }

    console.log(`Creating zip archive for job ${jobId}`)
    const zipPath = await createZipArchive(workDir, jobId)

    const s3Key = `exports/${jobId}.zip`
    console.log(`Uploading to S3: ${s3Key}`)
    await uploadToS3(zipPath, s3Key)

    console.log(`Generating presigned URL`)
    const downloadUrl = await generatePresignedUrl(s3Key)

    console.log(`Sending email to ${email}`)
    await sendDownloadEmail({
      to: email,
      downloadUrl,
      fileCount: fileIds.length,
      totalSize: formatFileSize(totalSize),
    })

    console.log(`Job ${jobId} completed successfully`)
  } finally {
    await cleanupWorkDir(workDir)
  }
}
