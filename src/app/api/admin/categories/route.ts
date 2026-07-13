import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { ok } from '@/server/http/envelope';
import * as adminCatalog from '@/server/services/admin-catalog.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'categories:write');
  return adminCatalog.listAdminCategories();
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'categories:write');
  const body: unknown = await request.json();
  const category = await adminCatalog.createAdminCategory(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'category',
    entityId: category.slug,
  });
  return ok(category, 201);
});
