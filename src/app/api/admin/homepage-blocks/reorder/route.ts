import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as homepage from '@/server/services/admin-homepage.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'homepage:write');
  const body: unknown = await request.json();
  const blocks = await homepage.reorderHomepageBlocks(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'homepage_block',
    entityId: 'reorder',
    meta: { ids: blocks.map((b) => b.id) },
  });
  return blocks;
});
