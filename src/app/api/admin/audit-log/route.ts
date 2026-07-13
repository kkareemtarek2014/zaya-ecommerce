import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as activity from '@/server/services/admin-activity.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'activity:read');
  return activity.listAdminAuditLog(new URL(request.url));
});
