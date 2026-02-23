import { mkdir, readdir, stat, statfs } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatFileSize } from '~/shared/formatters';
import type { ExportFileInfo, ExportJobMessage } from '~/shared/types/index';
import {
  addJobFailedFile,
  completeJob,
  failJob,
  updateJobDiskStats,
  updateJobDownloadProgress,
  updateJobPhase,
  updateJobTotalSize,
  updateJobUploadProgress,
  updateJobZipProgress,
} from './jobStore';
import { sendDownloadEmail } from './services/email';
import { downloadFile, getEntityMetadata, saveRoCrateMetadata } from './services/rocrate';
import { generatePresignedUrl, uploadToS3 } from './services/s3';
import { cleanupWorkDir, cleanupZipFile, createWorkDir, createZipArchive } from './services/zipper';

type FilesByItem = Map<string, { itemId: string; collectionId: string; files: ExportFileInfo[] }>;

const getDirectorySize = async (dirPath: string): Promise<number> => {
  let totalSize = 0;
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += await getDirectorySize(fullPath);
    } else {
      const fileStat = await stat(fullPath);
      totalSize += fileStat.size;
    }
  }

  return totalSize;
};

const collectDiskStats = async (workDir: string, jobId: string): Promise<void> => {
  try {
    const dirSize = await getDirectorySize(workDir);
    const workDirSizeMB = Math.round(dirSize / 1024 / 1024);
    const tmpStats = await statfs(tmpdir());
    const tmpFreeSpaceMB = Math.round((tmpStats.bfree * tmpStats.bsize) / 1024 / 1024);
    updateJobDiskStats(jobId, workDirSizeMB, tmpFreeSpaceMB);
  } catch {
    // Non-critical — skip if stats collection fails
  }
};

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
    updateJobPhase(jobId, 'grouping');
    const { filesByItem, totalSize } = await groupFilesByItem(files, accessToken);
    updateJobTotalSize(jobId, totalSize);

    // Save RO-Crate metadata for each collection
    const collectionIds = new Set([...filesByItem.values()].map(({ collectionId }) => collectionId).filter((id) => id !== 'unknown-collection'));

    for (const collectionId of collectionIds) {
      const collectionPath = extractPathFromId(collectionId);
      const collectionDir = join(workDir, collectionPath);
      await mkdir(collectionDir, { recursive: true });

      console.log(`Downloading RO-Crate metadata for collection: ${collectionId}`);
      await saveRoCrateMetadata(collectionId, collectionDir, accessToken);
    }

    // Process each item group
    updateJobPhase(jobId, 'downloading');
    let downloadedCount = 0;
    const failedFiles: { filename: string; error: string }[] = [];

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
        updateJobDownloadProgress(jobId, downloadedCount);

        try {
          await downloadFile(file.id, itemDir, file.filename, accessToken);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Failed to download file ${file.id}:`, error);
          failedFiles.push({ filename: file.filename, error: message });
          addJobFailedFile(jobId, file.filename, message);
        }

        if (downloadedCount % 5 === 0) {
          await collectDiskStats(workDir, jobId);
        }
      }
    }

    const successCount = files.length - failedFiles.length;

    if (failedFiles.length > 0) {
      console.warn(`${failedFiles.length}/${files.length} files failed to download`);
    }

    if (successCount > 0) {
      console.log(`Creating zip archive for job ${jobId}`);
      updateJobPhase(jobId, 'zipping');
      const workDirSize = await getDirectorySize(workDir);
      const zipPath = await createZipArchive(
        workDir,
        jobId,
        (processed, total) => {
          updateJobZipProgress(jobId, processed, total);
        },
        workDirSize,
      );

      const s3Key = `exports/${jobId}.zip`;
      console.log(`Uploading to S3: ${s3Key}`);
      updateJobPhase(jobId, 'uploading');
      await uploadToS3(zipPath, s3Key, (loaded, total) => {
        updateJobUploadProgress(jobId, loaded, total);
      });

      console.log(`Generating presigned URL`);
      const downloadUrl = await generatePresignedUrl(s3Key);

      console.log(`Sending email to ${email}`);
      updateJobPhase(jobId, 'emailing');
      await sendDownloadEmail({
        to: email,
        downloadUrl,
        fileCount: successCount,
        totalSize: formatFileSize(totalSize),
        missingFiles: failedFiles.length > 0 ? failedFiles : undefined,
      });

      completeJob(jobId, downloadUrl);
    } else {
      console.log(`All files failed — sending failure email to ${email}`);
      failJob(jobId, 'All files failed to download');
      await sendDownloadEmail({
        to: email,
        fileCount: files.length,
        totalSize: formatFileSize(totalSize),
        missingFiles: failedFiles,
      });
    }

    console.log(`Job ${jobId} completed${failedFiles.length > 0 ? ` with ${failedFiles.length} failed file(s)` : ' successfully'}`);
  } finally {
    await cleanupWorkDir(workDir);
    await cleanupZipFile(jobId);
  }
};
