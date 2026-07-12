import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return adminCatalog.getAdminProduct(id);
});

export const PUT = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return adminCatalog.updateAdminProduct(id, body);
});

export const DELETE = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  return adminCatalog.deleteAdminProduct(id);
});
