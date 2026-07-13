import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as homepage from '@/server/services/admin-homepage.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requirePermission(request, 'homepage:write');
  const { id } = await (context as Ctx).params;
  return homepage.getAdminHomepageBlock(id);
});

export const PUT = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'homepage:write');
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const block = await homepage.updateHomepageBlock(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'homepage_block',
    entityId: block.id,
  });
  return block;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'homepage:write');
  const { id } = await (context as Ctx).params;
  await homepage.deleteHomepageBlock(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'homepage_block',
    entityId: id,
  });
  return { ok: true };
});
