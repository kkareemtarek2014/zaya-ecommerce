import 'server-only';
import { getCloudflareEnv } from '@/server/db/request';

const MAX_BRIDAL_BYTES = 25 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'upload';
  return base.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120) || 'upload';
}

export async function putBridalUpload(
  requestId: string,
  file: File,
): Promise<{ key: string; fileName: string; fileType: string }> {
  const env = await getCloudflareEnv();
  const fileName = sanitizeFilename(file.name);
  const key = `bridal/${requestId}/${fileName}`;
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BRIDAL_BYTES) {
    throw new Error('File exceeds size limit'); // caller maps to PayloadTooLarge
  }
  await env.UPLOADS.put(key, bytes, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });
  return { key, fileName, fileType: file.type || 'application/octet-stream' };
}

export async function getUploadObject(key: string): Promise<R2ObjectBody | null> {
  const env = await getCloudflareEnv();
  return env.UPLOADS.get(key);
}

export { MAX_BRIDAL_BYTES };
