import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'products:write');
  const { id } = await (context as Ctx).params;
  const product = await adminCatalog.duplicateAdminProduct(id);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'product',
    entityId: product.id,
    meta: { duplicatedFrom: id },
  });
  return product;
});
