import { createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '~/server/services/config';
import type { Entity } from '~/shared/types/index';

const baseUrl = config.ROCRATE_API_BASE_URL;

const buildUrl = (endpoint: string): URL => {
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname;
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return new URL(`${basePath}${endpointPath}`, base.origin);
};

const buildHeaders = (token?: string, accept = 'application/json'): Record<string, string> => {
  const headers: Record<string, string> = { Accept: accept };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const downloadFile = async (fileId: string, destDir: string, filename: string, token?: string): Promise<string> => {
  const url = buildUrl(`/file/${encodeURIComponent(fileId)}`);

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token, '*/*'),
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const destPath = join(destDir, filename);
  const fileStream = createWriteStream(destPath);

  // @ts-expect-error - Type mismatch between global ReadableStream and Node's stream/web ReadableStream
  await pipeline(Readable.fromWeb(response.body), fileStream);

  return destPath;
};

export const getEntityMetadata = async (entityId: string, token?: string): Promise<Entity> => {
  const url = buildUrl(`/entity/${encodeURIComponent(entityId)}`);

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token, 'application/json'),
  });

  if (!response.ok) {
    throw new Error(`Failed to get entity metadata: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<Entity>;
};

const getEntityRoCrate = async (entityId: string, token?: string): Promise<unknown> => {
  const url = buildUrl(`/entity/${encodeURIComponent(entityId)}/rocrate`);

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token, 'application/ld+json'),
  });

  if (!response.ok) {
    throw new Error(`Failed to get RO-Crate metadata: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const saveRoCrateMetadata = async (entityId: string, destDir: string, token?: string): Promise<string> => {
  const rocrate = await getEntityRoCrate(entityId, token);
  const destPath = join(destDir, 'ro-crate-metadata.json');
  await writeFile(destPath, JSON.stringify(rocrate, null, 2));

  return destPath;
};
