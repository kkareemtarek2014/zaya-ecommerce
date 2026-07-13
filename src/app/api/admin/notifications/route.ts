import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as notifications from '@/server/services/notifications.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'notifications:read');
  return notifications.listAdminNotifications(new URL(request.url));
});
