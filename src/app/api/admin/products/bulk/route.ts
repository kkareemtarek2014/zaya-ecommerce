import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'products:write');
  const body: unknown = await request.json();
  const result = await adminCatalog.bulkAdminProducts(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'product',
    entityId: 'bulk',
    meta: { bulk: true, count: result.results.length },
  });
  return result;
});
