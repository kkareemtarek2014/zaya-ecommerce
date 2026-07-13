import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'locations:write');
  return locations.listAdminShippingZones();
});
