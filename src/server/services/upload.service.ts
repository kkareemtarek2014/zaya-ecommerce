import 'server-only';
import { getCloudflareEnv } from '@/server/db/request';
import {
  PayloadTooLargeError,
  ValidationError,
} from '@/server/http/errors';

const MAX_BRIDAL_BYTES = 25 * 1024 * 1024;
const MAX_CATALOG_BYTES = 5 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'upload';
  return base.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 120) || 'upload';
}

function extFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/svg+xml') return 'svg';
  return 'bin';
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
    throw new PayloadTooLargeError('File must be smaller than 25 MB');
  }
  await env.UPLOADS.put(key, bytes, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });
  return { key, fileName, fileType: file.type || 'application/octet-stream' };
}

/** Catalog (product/category) image → R2. Returns public media path. */
export async function putCatalogImage(
  keyPrefix: string,
  file: File,
): Promise<{ key: string; url: string }> {
  if (!file.type.startsWith('image/')) {
    throw new ValidationError('Only image uploads are accepted');
  }
  if (file.size > MAX_CATALOG_BYTES) {
    throw new PayloadTooLargeError('Image must be smaller than 5 MB');
  }
  const env = await getCloudflareEnv();
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const key = `${keyPrefix}/${id}.${extFromFile(file)}`;
  const bytes = await file.arrayBuffer();
  await env.UPLOADS.put(key, bytes, {
    httpMetadata: { contentType: file.type },
  });
  return { key, url: `/api/media/${key}` };
}

export async function deleteUploadObject(key: string): Promise<void> {
  const env = await getCloudflareEnv();
  await env.UPLOADS.delete(key);
}

/** Fetch a remote image URL into R2 (Temu import). */
export async function putRemoteCatalogImage(
  keyPrefix: string,
  imageUrl: string,
): Promise<{ key: string; url: string; size: number; mime: string }> {
  const res = await fetch(imageUrl, {
    headers: { accept: 'image/*,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new ValidationError(`Failed to fetch image (${res.status})`);
  }
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  if (!mime.startsWith('image/')) {
    throw new ValidationError('Remote URL is not an image');
  }
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_CATALOG_BYTES) {
    throw new PayloadTooLargeError('Image must be smaller than 5 MB');
  }
  const env = await getCloudflareEnv();
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/gif'
          ? 'gif'
          : 'jpg';
  const key = `${keyPrefix}/${id}.${ext}`;
  await env.UPLOADS.put(key, bytes, {
    httpMetadata: { contentType: mime },
  });
  return {
    key,
    url: `/api/media/${key}`,
    size: bytes.byteLength,
    mime,
  };
}

/** Extract R2 key from `/api/media/...` URL (or raw key). */
export function mediaUrlToKey(url: string): string | null {
  if (url.startsWith('/api/media/')) {
    return decodeURIComponent(url.slice('/api/media/'.length));
  }
  if (url.startsWith('products/') || url.startsWith('categories/')) {
    return url;
  }
  return null;
}

export async function getUploadObject(
  key: string,
): Promise<R2ObjectBody | null> {
  const env = await getCloudflareEnv();
  return env.UPLOADS.get(key);
}

export { MAX_BRIDAL_BYTES, MAX_CATALOG_BYTES };
