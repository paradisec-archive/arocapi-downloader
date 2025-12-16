import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { RoCrateFile } from '../../shared/types/index.ts'
import { config } from './config.ts'

const baseUrl = config.ROCRATE_API_BASE_URL

const buildUrl = (endpoint: string): URL => {
  const base = new URL(baseUrl)
  const basePath = base.pathname.endsWith('/') ? base.pathname.slice(0, -1) : base.pathname
  const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  return new URL(`${basePath}${endpointPath}`, base.origin)
}

export const getFileMetadata = async (fileId: string): Promise<RoCrateFile> => {
  const url = buildUrl(`/file/${encodeURIComponent(fileId)}`)
  console.log('🪚 url:', JSON.stringify(url, null, 2))

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get file metadata: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<RoCrateFile>
}

export const downloadFile = async (
  fileId: string,
  destDir: string,
  filename: string
): Promise<string> => {
  const url = buildUrl(`/file/${encodeURIComponent(fileId)}`)

  const response = await fetch(url.toString(), {
    headers: {
      Accept: '*/*',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const destPath = join(destDir, filename)
  const fileStream = createWriteStream(destPath)

  await pipeline(Readable.fromWeb(response.body), fileStream)

  return destPath
}

export const downloadFileWithMetadata = async (
  fileId: string,
  destDir: string
): Promise<{ path: string; metadata: RoCrateFile }> => {
  const metadata = await getFileMetadata(fileId)
  const path = await downloadFile(fileId, destDir, metadata.filename)

  return { path, metadata }
}
