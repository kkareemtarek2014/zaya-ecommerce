import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as stats from '@/server/services/admin-stats.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'dashboard:read');
  return stats.getAdminStats();
});
