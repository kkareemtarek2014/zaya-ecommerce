import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import { getCloudflareEnv, getRequestDb } from '@/server/db/request';
import { getIntegrationsStatus } from '@/server/jobs/integrations-reconcile';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'settings:write');
  const db = await getRequestDb();
  const env = await getCloudflareEnv();
  return getIntegrationsStatus(db, env);
});
