import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as bundles from '@/server/services/bundle.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'promos:write');
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const bundle = await bundles.updateAdminBundle(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'bundle',
    entityId: id,
  });
  return bundle;
});

export const PATCH = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'promos:write');
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  const bundle = await bundles.toggleAdminBundle(id, body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'bundle',
    entityId: id,
    meta: { active: bundle.active },
  });
  return bundle;
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'promos:write');
  const { id } = await (context as Ctx).params;
  await bundles.deleteAdminBundle(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'delete',
    entity: 'bundle',
    entityId: id,
  });
  return { ok: true as const };
});
