import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as homepage from '@/server/services/admin-homepage.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'homepage:write');
  return homepage.listAdminHomepageBlocks();
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'homepage:write');
  const body: unknown = await request.json();
  const block = await homepage.createHomepageBlock(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'homepage_block',
    entityId: block.id,
  });
  return block;
});
