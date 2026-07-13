import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as activity from '@/server/services/admin-activity.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'activity:read');
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '20') || 20;
  return activity.listAdminActivity(limit);
});
