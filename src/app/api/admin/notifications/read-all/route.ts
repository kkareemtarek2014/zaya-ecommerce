import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as notifications from '@/server/services/notifications.service';

export const POST = withHandler(async (request) => {
  await requirePermission(request, 'notifications:read');
  return notifications.markAllNotificationsRead();
});
