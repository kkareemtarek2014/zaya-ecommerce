import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as bridal from '@/server/services/admin-bridal.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return bridal.listAdminBridalRequests(new URL(request.url));
});
