import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as bundles from '@/server/services/bundle.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'promos:write');
  return bundles.listAdminBundles();
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'promos:write');
  const body: unknown = await request.json();
  const bundle = await bundles.createAdminBundle(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'bundle',
    entityId: bundle.id,
  });
  return bundle;
});
