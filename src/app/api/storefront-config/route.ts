import { withHandler } from '@/server/http/handler';
import * as settingsService from '@/server/services/settings.service';

export const GET = withHandler(async () => {
  return settingsService.getStorefrontConfig();
});
