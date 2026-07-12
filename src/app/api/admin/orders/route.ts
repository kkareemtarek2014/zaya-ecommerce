import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminOrders from '@/server/services/admin-orders.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return adminOrders.listAdminOrders(new URL(request.url));
});
