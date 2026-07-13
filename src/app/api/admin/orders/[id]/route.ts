import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminOrders from '@/server/services/admin-orders.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler(async (request, context) => {
  await requirePermission(request, 'orders:read');
  const { id } = await (context as Ctx).params;
  return adminOrders.getAdminOrder(id);
});
