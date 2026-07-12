import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import { ok } from '@/server/http/envelope';
import * as adminCatalog from '@/server/services/admin-catalog.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return adminCatalog.listAdminCategories();
});

export const POST = withHandler(async (request) => {
  await requireAdmin(request);
  const body: unknown = await request.json();
  const category = await adminCatalog.createAdminCategory(body);
  return ok(category, 201);
});
