import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { formatFileSize } from '~/shared/formatters';
import type { ExportFileInfo, ExportJobMessage } from '~/shared/types/index';
import { sendDownloadEmail } from './services/email';
import { downloadFile, getEntityMetadata, saveRoCrateMetadata } from './services/rocrate';
import { generatePresignedUrl, uploadToS3 } from './services/s3';
import { cleanupWorkDir, createWorkDir, createZipArchive } from './services/zipper';

type FilesByItem = Map<string, { itemId: string; collectionId: string; files: ExportFileInfo[] }>;

// Extract a clean directory path from an entity ID (URL)
// e.g. "https://admin-catalog.nabu-stage.paradisec.org.au/repository/JFTEST/001"
// becomes "admin-catalog.nabu-stage.paradisec.org.au/JFTEST/001"
const extractPathFromId = (entityId: string): string => {
  try {
    const url = new URL(entityId);
    // Remove /repository/ prefix from path if present
    const cleanPath = url.pathname.replace(/^\/repository\//, '/');

    return `${url.hostname}${cleanPath}`;
  } catch {
    // If not a valid URL, return as-is but sanitise for filesystem
    return entityId.replace(/[<>:"|?*]/g, '_');
  }
};

const groupFilesByItem = async (files: ExportFileInfo[], accessToken?: string): Promise<{ filesByItem: FilesByItem; totalSize: number }> => {
  const filesByItem: FilesByItem = new Map();
  const itemCache = new Map<string, string>(); // itemId -> collectionId
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.size;
    const itemId = file.memberOf.id;

    // Get collection ID for this item (with caching)
    let collectionId = itemCache.get(itemId);
    if (!collectionId) {
      console.log(`Fetching metadata for item: ${itemId}`);
      const itemMetadata = await getEntityMetadata(itemId, accessToken);
      collectionId = itemMetadata.memberOf?.id || 'unknown-collection';
      itemCache.set(itemId, collectionId);
    }

    // Group files by item
    const key = `${collectionId}/${itemId}`;
    const existing = filesByItem.get(key);
    if (existing) {
      existing.files.push(file);
    } else {
      filesByItem.set(key, { itemId, collectionId, files: [file] });
    }
  }

  return { filesByItem, totalSize };
};

export const processJob = async (job: ExportJobMessage): Promise<void> => {
  const { jobId, files, email, accessToken } = job;

  console.log(`Processing job ${jobId}: ${files.length} files for ${email}`);

  const workDir = await createWorkDir(jobId);

  try {
    // Group files by collection/item hierarchy
    console.log('Grouping files by collection and item...');
    const { filesByItem, totalSize } = await groupFilesByItem(files, accessToken);

    // Process each item group
    let downloadedCount = 0;
    for (const [, { itemId, files: itemFiles }] of filesByItem) {
      // Create directory structure using clean path from item ID
      // e.g. "https://example.com/repository/COLL/001" -> "example.com/COLL/001"
      const itemPath = extractPathFromId(itemId);
      const itemDir = join(workDir, itemPath);
      await mkdir(itemDir, { recursive: true });

      console.log(`Processing item ${itemId}: ${itemFiles.length} files -> ${itemPath}`);

      // Download RO-Crate metadata for the item
      console.log(`Downloading RO-Crate metadata for item: ${itemId}`);
      await saveRoCrateMetadata(itemId, itemDir, accessToken);

      // Download each file into the item directory
      for (const file of itemFiles) {
        downloadedCount++;
        console.log(`Downloading file ${downloadedCount}/${files.length}: ${file.filename}`);

        try {
          await downloadFile(file.id, itemDir, file.filename, accessToken);
        } catch (error) {
          console.error(`Failed to download file ${file.id}:`, error);
          throw error;
        }
      }
    }

    console.log(`Creating zip archive for job ${jobId}`);
    const zipPath = await createZipArchive(workDir, jobId);

    const s3Key = `exports/${jobId}.zip`;
    console.log(`Uploading to S3: ${s3Key}`);
    await uploadToS3(zipPath, s3Key);

    console.log(`Generating presigned URL`);
    const downloadUrl = await generatePresignedUrl(s3Key);

    console.log(`Sending email to ${email}`);
    await sendDownloadEmail({
      to: email,
      downloadUrl,
      fileCount: files.length,
      totalSize: formatFileSize(totalSize),
    });

    console.log(`Job ${jobId} completed successfully`);
  } finally {
    await cleanupWorkDir(workDir);
  }
};
