import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as adminUsers from '@/server/services/admin-users.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return adminUsers.listAdminUsers(new URL(request.url));
});
