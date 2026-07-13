import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { ok } from '@/server/http/envelope';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'products:read');
  return adminCatalog.listAdminProducts(new URL(request.url));
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'products:write');
  const body: unknown = await request.json();
  const product = await adminCatalog.createAdminProduct(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'product',
    entityId: product.id,
  });
  return ok(product, 201);
});
