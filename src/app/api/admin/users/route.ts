import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminUsers from '@/server/services/admin-users.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'users:read');
  return adminUsers.listAdminUsers(new URL(request.url));
});
