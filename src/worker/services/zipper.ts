import type { Readable } from 'node:stream';
import { ZipFile } from 'yazl';

type GetStreamFn = () => Promise<Readable>;

type StreamingZip = {
  outputStream: Readable;
  addBuffer: (data: Buffer, path: string) => void;
  addStreamLazy: (getStream: GetStreamFn, path: string, size: number) => void;
  finalize: () => void;
};

export const createStreamingZip = (): StreamingZip => {
  const zipFile = new ZipFile();

  return {
    // yazl's outputStream is a PassThrough at runtime, but typed as NodeJS.ReadableStream
    outputStream: zipFile.outputStream as unknown as Readable,
    addBuffer: (data, path) => {
      zipFile.addBuffer(data, path);
    },
    addStreamLazy: (getStream, path, size) => {
      zipFile.addReadStreamLazy(path, { size }, (cb) => {
        getStream().then(
          (stream) => cb(null, stream as unknown as NodeJS.ReadableStream),
          (error) => cb(error, null as unknown as NodeJS.ReadableStream),
        );
      });
    },
    finalize: () => {
      zipFile.end();
    },
  };
};
