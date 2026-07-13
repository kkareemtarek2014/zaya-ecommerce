import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as locations from '@/server/services/admin-locations.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'locations:write');
  return locations.listAdminGovernorates();
});

export const POST = withHandler(async (request) => {
  const auth = await requirePermission(request, 'locations:write');
  const body: unknown = await request.json();
  const governorate = await locations.createAdminGovernorate(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'create',
    entity: 'governorate',
    entityId: governorate.id,
  });
  return governorate;
});
