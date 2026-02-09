import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { formatFileSize } from '~/shared/formatters';
import type { ExportFileInfo, ExportJobMessage, RoCrateMetadata } from '~/shared/types/index';
import { sendDownloadEmail } from './services/email';
import { downloadFile, getEntityMetadata, getEntityRoCrate, writeRoCrateMetadata } from './services/rocrate';
import { filterRoCrate } from './services/rocrateFilter';
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

    // Fetch RO-Crate metadata for each collection (store in memory, don't write yet)
    const collectionIds = new Set([...filesByItem.values()].map(({ collectionId }) => collectionId).filter((id) => id !== 'unknown-collection'));

    const collectionMetadata = new Map<string, RoCrateMetadata>();
    for (const collectionId of collectionIds) {
      console.log(`Fetching RO-Crate metadata for collection: ${collectionId}`);
      const metadata = await getEntityRoCrate(collectionId, accessToken);
      collectionMetadata.set(collectionId, metadata);
    }

    // Track which items had at least one successful file, grouped by collection
    const itemsWithFilesByCollection = new Map<string, Set<string>>();

    // Process each item group
    let downloadedCount = 0;
    const failedFiles: { filename: string; error: string }[] = [];

    for (const [, { itemId, collectionId, files: itemFiles }] of filesByItem) {
      // Create directory structure using clean path from item ID
      const itemPath = extractPathFromId(itemId);
      const itemDir = join(workDir, itemPath);
      await mkdir(itemDir, { recursive: true });

      console.log(`Processing item ${itemId}: ${itemFiles.length} files -> ${itemPath}`);

      // Fetch item RO-Crate metadata (store in memory)
      console.log(`Fetching RO-Crate metadata for item: ${itemId}`);
      const itemMetadata = await getEntityRoCrate(itemId, accessToken);

      // Download each file, tracking successes
      const successfulFileIds = new Set<string>();

      for (const file of itemFiles) {
        downloadedCount++;
        console.log(`Downloading file ${downloadedCount}/${files.length}: ${file.filename}`);

        try {
          await downloadFile(file.id, itemDir, file.filename, accessToken);
          successfulFileIds.add(file.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Failed to download file ${file.id}:`, error);
          failedFiles.push({ filename: file.filename, error: message });
        }
      }

      // Write filtered item RO-Crate metadata (only if at least one file succeeded)
      if (successfulFileIds.size > 0) {
        const filteredMetadata = filterRoCrate(itemMetadata, successfulFileIds);
        await writeRoCrateMetadata(filteredMetadata, itemDir);

        // Track this item as having files for collection-level filtering
        const itemsSet = itemsWithFilesByCollection.get(collectionId) ?? new Set<string>();
        itemsSet.add(itemId);
        itemsWithFilesByCollection.set(collectionId, itemsSet);
      }
    }

    // Write filtered collection RO-Crate metadata
    for (const [collectionId, metadata] of collectionMetadata) {
      const includedItemIds = itemsWithFilesByCollection.get(collectionId) ?? new Set<string>();
      if (includedItemIds.size === 0) {
        continue;
      }

      const collectionPath = extractPathFromId(collectionId);
      const collectionDir = join(workDir, collectionPath);
      await mkdir(collectionDir, { recursive: true });

      const filteredMetadata = filterRoCrate(metadata, includedItemIds);
      await writeRoCrateMetadata(filteredMetadata, collectionDir);
    }

    const successCount = files.length - failedFiles.length;

    if (failedFiles.length > 0) {
      console.warn(`${failedFiles.length}/${files.length} files failed to download`);
    }

    if (successCount > 0) {
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
        fileCount: successCount,
        totalSize: formatFileSize(totalSize),
        missingFiles: failedFiles.length > 0 ? failedFiles : undefined,
      });
    } else {
      console.log(`All files failed — sending failure email to ${email}`);
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
  }
};
