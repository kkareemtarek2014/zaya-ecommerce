import { withHandler } from '@/server/http/handler';
import { NotFoundError } from '@/server/http/errors';
import { getUploadObject } from '@/server/services/upload.service';

type Ctx = { params: Promise<{ key: string[] }> };

/** Public read for R2 catalog/bridal objects stored under UPLOADS. */
export const GET = withHandler(async (_request, context) => {
  const { key: parts } = await (context as Ctx).params;
  const key = parts.map((p) => decodeURIComponent(p)).join('/');
  if (!key || key.includes('..')) {
    throw new NotFoundError('Not found');
  }
  const obj = await getUploadObject(key);
  if (!obj) throw new NotFoundError('Not found');

  const headers = new Headers();
  headers.set(
    'Content-Type',
    obj.httpMetadata?.contentType || 'application/octet-stream',
  );
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (obj.size != null) headers.set('Content-Length', String(obj.size));

  return new Response(obj.body, { status: 200, headers });
});
