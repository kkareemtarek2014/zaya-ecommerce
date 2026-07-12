import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as stats from '@/server/services/admin-stats.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return stats.getAdminStats();
});
