import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminOrders from '@/server/services/admin-orders.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'orders:read');
  return adminOrders.listAdminOrders(new URL(request.url));
});
