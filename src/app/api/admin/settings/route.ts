import { withHandler } from '@/server/http/handler';
import { requireAdmin } from '@/server/auth/require-admin';
import * as settingsService from '@/server/services/settings.service';

export const GET = withHandler(async (request) => {
  await requireAdmin(request);
  return settingsService.getAdminSettings();
});

export const PUT = withHandler(async (request) => {
  await requireAdmin(request);
  const body: unknown = await request.json();
  return settingsService.updateAdminSettings(body);
});
