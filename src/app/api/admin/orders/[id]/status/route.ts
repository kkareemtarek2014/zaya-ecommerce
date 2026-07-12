import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminOrders from '@/server/services/admin-orders.service';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin(request);
  const { id } = await (context as Ctx).params;
  const body: unknown = await request.json();
  return adminOrders.patchAdminOrderStatus(id, body);
});
