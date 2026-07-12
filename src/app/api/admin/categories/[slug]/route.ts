import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminCatalog from '@/server/services/admin-catalog.service';

type Ctx = { params: Promise<{ slug: string }> };

export const PUT = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return adminCatalog.updateAdminCategory(decodeURIComponent(slug), body);
});

export const DELETE = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { slug } = await (context as Ctx).params;
  return adminCatalog.deleteAdminCategory(decodeURIComponent(slug));
});
