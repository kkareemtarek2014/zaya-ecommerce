import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as bridal from '@/server/services/admin-bridal.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'bridal:write');
  return bridal.listAdminBridalRequests(new URL(request.url));
});
