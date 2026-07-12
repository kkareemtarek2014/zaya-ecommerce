import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as promos from '@/server/services/admin-promos.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return promos.listAdminPromos();
});

export const POST = withHandler(async (request) => {
  await requireAdmin(request);
  const body: unknown = await request.json();
  return promos.createAdminPromo(body);
});
