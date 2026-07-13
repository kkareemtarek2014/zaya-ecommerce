import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as adminJobs from '@/server/services/admin-jobs.service';

export const POST = withHandler(async (request) => {
  await requirePermission(request, 'settings:write');
  const body: unknown = await request.json();
  return adminJobs.runAdminJob(body);
});
