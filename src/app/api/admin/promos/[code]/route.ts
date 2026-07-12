import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as promos from '@/server/services/admin-promos.service';

type Ctx = { params: Promise<{ code: string }> };

export const PUT = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return promos.updateAdminPromo(decodeURIComponent(code), body);
});

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return promos.toggleAdminPromo(decodeURIComponent(code), body);
});

export const DELETE = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { code } = await (context as Ctx).params;
  return promos.deleteAdminPromo(decodeURIComponent(code));
});
