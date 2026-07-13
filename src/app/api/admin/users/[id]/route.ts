import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminUsers from '@/server/services/admin-users.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requirePermission(request, 'users:read');
  const { id } = await (context as Ctx).params;
  return adminUsers.getAdminUser(id);
});

export const PUT = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'users:write');
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return adminUsers.updateAdminUser(id, body, auth.user.id);
});

export const DELETE = withHandler(async (request, context) => {
  const auth = await requirePermission(request, 'users:write');
  const { id } = await (context as Ctx).params;
  return adminUsers.deleteAdminUser(id, auth.user.id);
});
