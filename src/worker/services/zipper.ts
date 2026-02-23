import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import archiver from 'archiver';

export const createWorkDir = async (jobId: string): Promise<string> => {
  const workDir = join(tmpdir(), 'rocrate-downloads', jobId);
  await mkdir(workDir, { recursive: true });

  return workDir;
};

export const cleanupWorkDir = async (workDir: string): Promise<void> => {
  try {
    await rm(workDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up work directory:', error);
  }
};

type ZipProgressCallback = (processedBytes: number, totalBytes: number) => void;

export const createZipArchive = async (sourceDir: string, jobId: string, onProgress?: ZipProgressCallback, knownTotalBytes?: number): Promise<string> => {
  const zipPath = join(tmpdir(), `${jobId}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 6 },
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Zip archive created: ${archive.pointer()} bytes`);
      resolve(zipPath);
    });

    archive.on('error', (error) => {
      reject(error);
    });

    archive.on('warning', (warning) => {
      if (warning.code === 'ENOENT') {
        console.warn('Archiver warning:', warning);
      } else {
        reject(warning);
      }
    });

    if (onProgress) {
      archive.on('progress', (progress) => {
        onProgress(progress.fs.processedBytes, knownTotalBytes ?? progress.fs.totalBytes);
      });
    }

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};
