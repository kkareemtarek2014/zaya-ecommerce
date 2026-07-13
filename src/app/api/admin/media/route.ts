import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { ok } from '@/server/http/envelope';
import * as adminMedia from '@/server/services/admin-media.service';
import { writeAuditLog } from '@/server/services/audit.service';
import { ValidationError } from '@/server/http/errors';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'media:write');
  return adminMedia.listAdminMedia(new URL(request.url));
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'media:write');
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('file is required');
  }
  const folderRaw = form.get('folder');
  const folder = typeof folderRaw === 'string' ? folderRaw : undefined;
  const asset = await adminMedia.uploadAdminMedia(file, auth.user.id, folder);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'media',
    entityId: asset.id,
    meta: { media: true },
  });
  return ok(asset, 201);
});
