import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as notifications from '@/server/services/notifications.service';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withHandler(async (request, context) => {
  await requirePermission(request, 'notifications:read');
  const { id } = await (context as Ctx).params;
  return notifications.markNotificationRead(id);
});
