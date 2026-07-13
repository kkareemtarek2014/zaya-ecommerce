import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { listAdminShipments } from '@/server/services/bosta.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'orders:read');
  return listAdminShipments(new URL(request.url));
});
