import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return locations.listAdminShippingZones();
});
