import { withHandler } from '@/server/http/handler';
import { requirePermission } from '@/server/auth/require-admin';
import * as settingsService from '@/server/services/settings.service';
import { writeAuditLog } from '@/server/services/audit.service';

export const GET = withHandler(async (request) => {
  await requirePermission(request, 'settings:write');
  return settingsService.getAdminSettings();
});

export const PUT = withHandler(async (request) => {
  const auth = await requirePermission(request, 'settings:write');
  const body: unknown = await request.json();
  const settings = await settingsService.updateAdminSettings(body);
  await writeAuditLog({
    actorId: auth.user.id,
    action: 'update',
    entity: 'settings',
    entityId: 'settings',
  });
  return settings;
});
